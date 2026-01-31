import { PrismaClient } from '@prisma/client'
import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { IPurchaseRepository } from '@domain/repositories/ipurchase-repository'
import { Refund } from '@domain/entities/refund'
import { CreditTransactionType } from '@domain/entities/credit-transaction'
import { CreditDomainService } from '@domain/services/credit-domain-service'
import { PurchaseDomainService } from '@domain/services/purchase-domain-service'
import { Money } from '@domain/value-objects/money'
import { ValidationError, NotFoundError } from '@shared/errors'
import { Logger } from '@shared/utils/logger'
import { RefundPurchaseDto, RefundResultDto } from '../../dtos/purchase-dto'
import { PurchaseMapper } from '../../services/purchase-mapper'

/**
 * Refund Purchase Use Case
 * Processes full or partial refunds for a purchase
 * Credits the customer's balance back
 */
export class RefundPurchaseUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly creditRepository: ICreditRepository,
    private readonly purchaseRepository: IPurchaseRepository
  ) {}

  async execute(request: RefundPurchaseDto): Promise<RefundResultDto> {
    // Validate input
    this.validate(request)

    Logger.info('Processing refund', {
      purchaseId: request.purchaseId,
      amount: request.amount,
    })

    const refundAmount = Money.from(request.amount)

    // Execute refund within transaction
    const result = await this.executeTransaction(
      request.purchaseId,
      refundAmount,
      request.reason,
      request.refundedBy
    )

    Logger.info('Refund processed successfully', {
      refundId: result.refundId,
      amount: result.amount,
    })

    return result
  }

  private async executeTransaction(
    purchaseId: string,
    refundAmount: Money,
    reason?: string,
    refundedBy?: string
  ): Promise<RefundResultDto> {
    return await this.prisma.$transaction(async (tx) => {
      const creditRepo = new (this.creditRepository.constructor as any)(tx)
      const purchaseRepo = new (this.purchaseRepository.constructor as any)(tx)

      // Get purchase
      const purchase = await purchaseRepo.findById(purchaseId)
      if (!purchase) {
        throw new NotFoundError('Purchase', purchaseId)
      }

      // Validate refund using domain service
      const canRefundCheck = PurchaseDomainService.canBeRefunded(purchase)
      if (!canRefundCheck.canRefund) {
        throw new ValidationError('Purchase is not refundable', [
          canRefundCheck.reason || 'Unknown reason',
        ])
      }

      const amountCheck = PurchaseDomainService.validateRefundAmount(purchase, refundAmount)
      if (!amountCheck.isValid) {
        throw new ValidationError('Invalid refund amount', [amountCheck.reason || 'Invalid amount'])
      }

      // Create refund record
      const refund = Refund.create({
        purchaseId: purchase.id,
        amount: refundAmount,
        reason,
        refundedBy,
      })
      await purchaseRepo.createRefund(refund)

      // Update purchase
      purchase.refund(refundAmount)
      const updatedPurchase = await purchaseRepo.update(purchase)

      // Credit customer's balance using domain service
      const customerId = purchase.customerId
      const balance = await creditRepo.findByCustomerId(customerId)
      if (!balance) {
        throw new NotFoundError('CreditBalance', customerId.value)
      }

      const { balance: updatedBalance, transaction } = CreditDomainService.executeOperation(
        balance,
        CreditTransactionType.REFUND,
        refundAmount,
        `Refund for purchase ${purchaseId}${reason ? `: ${reason}` : ''}`,
        purchaseId,
        { refundId: refund.id, refundedBy },
        refundedBy || 'system'
      )

      await creditRepo.update(updatedBalance)
      await creditRepo.createTransaction(transaction)

      // Map to DTO
      return PurchaseMapper.toRefundResultDto(updatedPurchase, refund)
    })
  }

  private validate(request: RefundPurchaseDto): void {
    const errors: string[] = []

    if (!request.purchaseId || request.purchaseId.trim().length === 0) {
      errors.push('Purchase ID is required')
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Refund amount must be greater than 0')
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid refund purchase request', errors)
    }
  }
}
