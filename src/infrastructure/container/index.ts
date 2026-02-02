import { PrismaClient } from '@prisma/client'
import { prisma } from '@infrastructure/database/client'

// Repositories
import { CreditRepository } from '@infrastructure/database/repositories/credit-repository'
import { PurchaseRepository } from '@infrastructure/database/repositories/purchase-repository'
import { PromoCodeRepository } from '@infrastructure/database/repositories/promo-code-repository'

// External API Clients
import { CustomerApiClient } from '@infrastructure/external-apis/customer-api-client'
import { ProductApiClient } from '@infrastructure/external-apis/product-api-client'
import { ShipmentApiClient } from '@infrastructure/external-apis/shipment-api-client'

// Use Cases - Credit
import {
  GrantCreditUseCase,
  DeductCreditUseCase,
  GetBalanceUseCase,
  GetTransactionHistoryUseCase,
} from '@application/use-cases/credit'

// Use Cases - Purchase
import {
  CreatePurchaseUseCase,
  ListPurchasesUseCase,
  GetPurchaseUseCase,
  RefundPurchaseUseCase,
} from '@application/use-cases/purchase'

// Controllers
import { CreditController } from '../../presentation/http/controllers/credit-controller'
import { PurchaseController } from '../../presentation/http/controllers/purchase-controller'
import { PromoCodeController } from '@presentation/http/controllers/promo-code-controller'
import { CreatePromoCodeUseCase } from '@application/use-cases/promo-code/create-promo-code-use-case'
import { ValidatePromoCodeUseCase } from '@application/use-cases/promo-code/validate-promo-code-use-case'
import { ListPromoCodesUseCase } from '@application/use-cases/promo-code/list-promo-codes-use-case'
import { DisablePromoCodeUseCase } from '@application/use-cases/promo-code/disable-promo-code-use-case'

/**
 * Dependency Injection Container
 * Wires up all dependencies and creates controller instances
 */
export class Container {
  private static instance: Container

  // Infrastructure
  public readonly prisma: PrismaClient

  // Repositories
  public readonly creditRepository: CreditRepository
  public readonly purchaseRepository: PurchaseRepository
  public readonly promoCodeRepository: PromoCodeRepository

  // External API Clients
  public readonly customerApiClient: CustomerApiClient
  public readonly productApiClient: ProductApiClient
  public readonly shipmentApiClient: ShipmentApiClient

  // Use Cases - Credit
  public readonly grantCreditUseCase: GrantCreditUseCase
  public readonly deductCreditUseCase: DeductCreditUseCase
  public readonly getBalanceUseCase: GetBalanceUseCase
  public readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase

  // Use Cases - Purchase
  public readonly createPurchaseUseCase: CreatePurchaseUseCase
  public readonly listPurchasesUseCase: ListPurchasesUseCase
  public readonly getPurchaseUseCase: GetPurchaseUseCase
  public readonly refundPurchaseUseCase: RefundPurchaseUseCase

  // Use Cases - Promo Code
  public readonly createPromoCodeUseCase: CreatePromoCodeUseCase
  public readonly validatePromoCodeUseCase: ValidatePromoCodeUseCase
  public readonly listPromoCodesUseCase: ListPromoCodesUseCase
  public readonly disablePromoCodeUseCase: DisablePromoCodeUseCase

  // Controllers
  public readonly creditController: CreditController
  public readonly purchaseController: PurchaseController
  public readonly promoCodeController: PromoCodeController

  private constructor() {
    // Infrastructure
    this.prisma = prisma

    // Repositories
    this.creditRepository = new CreditRepository(this.prisma)
    this.purchaseRepository = new PurchaseRepository(this.prisma)
    this.promoCodeRepository = new PromoCodeRepository(this.prisma)

    // External API Clients
    this.customerApiClient = new CustomerApiClient()
    this.productApiClient = new ProductApiClient()
    this.shipmentApiClient = new ShipmentApiClient()

    // Use Cases - Credit
    this.grantCreditUseCase = new GrantCreditUseCase(this.creditRepository)
    this.deductCreditUseCase = new DeductCreditUseCase(this.creditRepository)
    this.getBalanceUseCase = new GetBalanceUseCase(this.creditRepository)
    this.getTransactionHistoryUseCase = new GetTransactionHistoryUseCase(this.creditRepository)

    // Use Cases - Purchase
    this.createPurchaseUseCase = new CreatePurchaseUseCase(
      this.prisma,
      this.creditRepository,
      this.purchaseRepository,
      this.customerApiClient,
      this.productApiClient,
      this.shipmentApiClient
    )

    // Use Cases - Promo Code
    this.createPromoCodeUseCase = new CreatePromoCodeUseCase(this.promoCodeRepository)
    this.validatePromoCodeUseCase = new ValidatePromoCodeUseCase(this.promoCodeRepository)
    this.listPromoCodesUseCase = new ListPromoCodesUseCase(this.promoCodeRepository)
    this.disablePromoCodeUseCase = new DisablePromoCodeUseCase(this.promoCodeRepository)

    this.listPurchasesUseCase = new ListPurchasesUseCase(this.purchaseRepository)
    this.getPurchaseUseCase = new GetPurchaseUseCase(this.purchaseRepository)
    this.refundPurchaseUseCase = new RefundPurchaseUseCase(
      this.prisma,
      this.creditRepository,
      this.purchaseRepository
    )

    // Controllers
    this.creditController = new CreditController(
      this.grantCreditUseCase,
      this.deductCreditUseCase,
      this.getBalanceUseCase,
      this.getTransactionHistoryUseCase
    )

    this.purchaseController = new PurchaseController(
      this.createPurchaseUseCase,
      this.listPurchasesUseCase,
      this.getPurchaseUseCase,
      this.refundPurchaseUseCase
    )

    this.promoCodeController = new PromoCodeController(
      this.createPromoCodeUseCase,
      this.validatePromoCodeUseCase,
      this.listPromoCodesUseCase,
      this.disablePromoCodeUseCase
    )
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }
}

// Export singleton instance
export const container = Container.getInstance()
