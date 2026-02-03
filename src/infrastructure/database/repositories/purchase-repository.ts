import { PrismaClient, Prisma, Purchase as PrismaPurchase } from '@prisma/client'
import { IPurchaseRepository } from '@domain/repositories/ipurchase-repository'
import { Purchase, PurchaseStatus } from '@domain/entities/purchase'
import { Refund } from '@domain/entities/refund'
import { CustomerId } from '@domain/value-objects/customer-id'
import { ProductId } from '@domain/value-objects/product-id'
import { Money } from '@domain/value-objects/money'
import { Customer, Product } from '@shared/types/external-api.types'

/**
 * Purchase Repository Implementation
 * Manages purchases and refunds using Prisma
 */
export class PurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(purchase: Purchase): Promise<Purchase> {
    const record = await this.prisma.purchase.create({
      data: {
        id: purchase.id,
        customerId: purchase.customerId.value,
        productId: purchase.productId.value,
        quantity: purchase.quantity,
        unitPrice: purchase.unitPrice.amount,
        totalAmount: purchase.totalAmount.amount,
        refundedAmount: purchase.refundedAmount.amount,
        status: purchase.status,
        shipmentId: purchase.shipmentId,
        productSnapshot: this.serializeSnapshot(purchase.productSnapshot),
        customerSnapshot: this.serializeSnapshot(purchase.customerSnapshot),
        createdBy: purchase.createdBy,
      },
    })

    return this.toDomain(record)
  }

  async findById(id: string): Promise<Purchase | null> {
    const record = await this.prisma.purchase.findUnique({
      where: { id },
    })

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  async findByCustomerId(
    customerId: CustomerId,
    limit: number = 50,
    offset: number = 0
  ): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: { customerId: customerId.value },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return records.map((record) => this.toDomain(record))
  }

  async findByProductId(
    productId: ProductId,
    limit: number = 50,
    offset: number = 0
  ): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: { productId: productId.value },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return records.map((record) => this.toDomain(record))
  }

  async findAll(options?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<Purchase[]> {
    const records = await this.prisma.purchase.findMany({
      where: options?.status ? { status: options.status as PurchaseStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    })

    return records.map((record) => this.toDomain(record))
  }

  async update(purchase: Purchase): Promise<Purchase> {
    const record = await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        quantity: purchase.quantity,
        unitPrice: purchase.unitPrice.amount,
        totalAmount: purchase.totalAmount.amount,
        refundedAmount: purchase.refundedAmount.amount,
        status: purchase.status,
        shipmentId: purchase.shipmentId,
        productSnapshot: this.serializeSnapshot(purchase.productSnapshot),
        customerSnapshot: this.serializeSnapshot(purchase.customerSnapshot),
        updatedAt: new Date(),
      },
    })

    return this.toDomain(record)
  }

  async createRefund(refund: Refund): Promise<Refund> {
    const record = await this.prisma.refund.create({
      data: {
        id: refund.id,
        purchaseId: refund.purchaseId,
        amount: refund.amount.amount,
        reason: refund.reason,
        refundedBy: refund.refundedBy,
      },
    })

    return Refund.reconstitute({
      id: record.id,
      purchaseId: record.purchaseId,
      amount: Money.from(record.amount),
      reason: record.reason || undefined,
      refundedBy: record.refundedBy || undefined,
      createdAt: record.createdAt,
    })
  }

  async getRefunds(purchaseId: string): Promise<Refund[]> {
    const records = await this.prisma.refund.findMany({
      where: { purchaseId },
      orderBy: { createdAt: 'desc' },
    })

    return records.map((record) =>
      Refund.reconstitute({
        id: record.id,
        purchaseId: record.purchaseId,
        amount: Money.from(record.amount),
        reason: record.reason || undefined,
        refundedBy: record.refundedBy || undefined,
        createdAt: record.createdAt,
      })
    )
  }

  async count(filters?: { customerId?: string; status?: string }): Promise<number> {
    return this.prisma.purchase.count({
      where: {
        customerId: filters?.customerId,
        status: filters?.status as PurchaseStatus,
      },
    })
  }

  /**
   * Convert Prisma model to Domain entity
   */
  private toDomain(record: PrismaPurchase): Purchase {
    return Purchase.reconstitute({
      id: record.id,
      customerId: CustomerId.from(record.customerId),
      productId: ProductId.from(record.productId),
      quantity: record.quantity,
      unitPrice: Money.from(record.unitPrice),
      totalAmount: Money.from(record.totalAmount),
      refundedAmount: Money.from(record.refundedAmount),
      status: record.status as PurchaseStatus,
      shipmentId: record.shipmentId || undefined,
      productSnapshot: this.deserializeSnapshot<Product>(record.productSnapshot),
      customerSnapshot: this.deserializeSnapshot<Customer>(record.customerSnapshot),
      createdBy: record.createdBy || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  private serializeSnapshot<T extends object>(snapshot?: T): Prisma.InputJsonValue | undefined {
    if (!snapshot) {
      return undefined
    }

    return snapshot as unknown as Prisma.InputJsonValue
  }

  private deserializeSnapshot<T>(snapshot: Prisma.JsonValue | null): T | undefined {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return undefined
    }

    return snapshot as T
  }
}
