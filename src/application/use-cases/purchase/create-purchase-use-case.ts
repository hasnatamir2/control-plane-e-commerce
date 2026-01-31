import { PrismaClient } from '@prisma/client'
import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { IPurchaseRepository } from '@domain/repositories/ipurchase-repository'
import { ICustomerApiClient } from '@infrastructure/external-apis/customer-api-client'
import { IProductApiClient } from '@infrastructure/external-apis/product-api-client'
import { IShipmentApiClient } from '@infrastructure/external-apis/shipment-api-client'
import { Purchase } from '@domain/entities/purchase'
import { CreditTransactionType } from '@domain/entities/credit-transaction'
import { CreditDomainService } from '@domain/services/credit-domain-service'
import { CustomerId } from '@domain/value-objects/customer-id'
import { ProductId } from '@domain/value-objects/product-id'
import { Money } from '@domain/value-objects/money'
import {
  ValidationError,
  InsufficientCreditError,
  ShipmentFailedError,
  NotFoundError,
} from '../../../shared/errors'
import { Logger } from '../../../shared/utils/logger'
import { CreatePurchaseDto, PurchaseDto } from '../../dtos/purchase-dto'
import { PurchaseMapper } from '../../services/purchase-mapper'

/**
 * Create Purchase Use Case
 *
 * This is the most complex use case. It:
 * 1. Fetches customer and product from external APIs
 * 2. Checks credit balance
 * 3. Starts a database transaction
 * 4. Deducts credit
 * 5. Creates purchase record (PENDING)
 * 6. Creates shipment via external API
 * 7. If shipment fails → ROLLBACK everything
 * 8. If shipment succeeds → Update purchase to COMPLETED
 */
export class CreatePurchaseUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly creditRepository: ICreditRepository,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly customerApiClient: ICustomerApiClient,
    private readonly productApiClient: IProductApiClient,
    private readonly shipmentApiClient: IShipmentApiClient
  ) {}

  async execute(dto: CreatePurchaseDto): Promise<PurchaseDto> {
    // Validate input
    this.validate(dto)

    Logger.info('Creating purchase', {
      customerId: dto.customerId,
      productId: dto.productId,
      quantity: dto.quantity,
    })

    const customerId = CustomerId.from(dto.customerId)
    const productId = ProductId.from(dto.productId)

    // Step 1: Fetch customer from external API
    Logger.debug('Fetching customer from API')
    const customer = await this.customerApiClient.getCustomer(dto.customerId)

    // Step 2: Fetch product from external API
    Logger.debug('Fetching product from API')
    const product = await this.productApiClient.getProduct(dto.productId)

    // Step 3: Calculate total amount
    const unitPrice = Money.from(product.price)
    const totalAmount = unitPrice.multiply(dto.quantity)

    Logger.debug('Purchase total calculated', {
      unitPrice: unitPrice.value,
      quantity: dto.quantity,
      totalAmount: totalAmount.value,
    })

    // Step 4: Check credit balance (outside transaction)
    const balance = await this.creditRepository.getOrCreate(customerId)
    if (!CreditDomainService.canAffordPurchase(balance, totalAmount)) {
      Logger.warn('Insufficient credit balance', {
        customerId: dto.customerId,
        required: totalAmount.value,
        available: balance.currentBalance.value,
      })
      throw new InsufficientCreditError(
        customerId.value,
        totalAmount.toString(),
        balance.currentBalance.toString()
      )
    }

    // Step 5-8: Execute purchase within transaction
    const purchase = await this.executeTransaction(
      customerId,
      productId,
      dto.quantity,
      unitPrice,
      totalAmount,
      customer,
      product,
      dto.createdBy
    )

    Logger.info('Purchase created successfully', {
      purchaseId: purchase.id,
      shipmentId: purchase.shipmentId,
    })

    // Map to DTO
    return PurchaseMapper.toPurchaseDto(purchase)
  }

  /**
   * Execute purchase within a database transaction
   * If shipment fails, everything rolls back automatically
   */
  private async executeTransaction(
    customerId: CustomerId,
    productId: ProductId,
    quantity: number,
    unitPrice: Money,
    totalAmount: Money,
    customer: any,
    product: any,
    createdBy?: string
  ): Promise<Purchase> {
    return await this.prisma.$transaction(async (tx) => {
      // Create repository instances with transaction client
      const creditRepo = new (this.creditRepository.constructor as any)(tx)
      const purchaseRepo = new (this.purchaseRepository.constructor as any)(tx)

      // Step 5: Deduct credit using domain service
      Logger.debug('Deducting credit')
      const balance = await creditRepo.findByCustomerId(customerId)
      if (!balance) {
        throw new NotFoundError('CreditBalance', customerId.value)
      }

      const { balance: updatedBalance, transaction } = CreditDomainService.executeOperation(
        balance,
        CreditTransactionType.DEDUCT,
        totalAmount,
        `Purchase of ${product.name}`,
        undefined,
        {
          productId: productId.value,
          productName: product.name,
          quantity,
        },
        createdBy || 'system'
      )

      await creditRepo.update(updatedBalance)
      await creditRepo.createTransaction(transaction)

      // Step 6: Create purchase record (PENDING status)
      Logger.debug('Creating purchase record')
      const purchase = Purchase.create({
        customerId,
        productId,
        quantity,
        unitPrice,
        productSnapshot: product,
        customerSnapshot: customer,
        createdBy,
      })

      const createdPurchase = await purchaseRepo.create(purchase)

      // Step 7: Create shipment (CRITICAL - if this fails, transaction rolls back)
      Logger.debug('Creating shipment')
      let shipmentId: string
      try {
        const shipmentResponse = await this.shipmentApiClient.createShipment({
          shippingAddress: customer.shippingAddress,
          products: [
            {
              sku: product.sku,
              quantity,
            },
          ],
        })
        shipmentId = shipmentResponse.id
        Logger.debug('Shipment created', { shipmentId })
      } catch (error) {
        Logger.error('Shipment creation failed', error)
        // This will cause the transaction to rollback
        throw new ShipmentFailedError(error instanceof Error ? error.message : 'Unknown error')
      }

      // Step 8: Update purchase to COMPLETED with shipment ID
      Logger.debug('Completing purchase')
      createdPurchase.complete(shipmentId)
      const completedPurchase = await purchaseRepo.update(createdPurchase)
      // Link transaction to purchase
      transaction.linkToPurchase(completedPurchase.id)

      return completedPurchase
    })
  }

  private validate(dto: CreatePurchaseDto): void {
    const errors: string[] = []

    if (!dto.customerId || dto.customerId.trim().length === 0) {
      errors.push('Customer ID is required')
    }

    if (!dto.productId || dto.productId.trim().length === 0) {
      errors.push('Product ID is required')
    }

    if (!dto.quantity || dto.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid create purchase request', errors)
    }
  }
}
