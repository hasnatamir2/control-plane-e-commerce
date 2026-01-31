import { PrismaClient } from '@prisma/client'
import { prisma } from '@infrastructure/database/client'

// Repositories
import { CreditRepository } from '@infrastructure/database/repositories/credit-repository'
import { PurchaseRepository } from '@infrastructure/database/repositories/purchase-repository'

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

  // Controllers
  public readonly creditController: CreditController
  public readonly purchaseController: PurchaseController

  private constructor() {
    // Infrastructure
    this.prisma = prisma

    // Repositories
    this.creditRepository = new CreditRepository(this.prisma)
    this.purchaseRepository = new PurchaseRepository(this.prisma)

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
