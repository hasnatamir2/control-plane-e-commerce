import { PrismaClient } from '@prisma/client'
import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { CreditBalance } from '@domain/entities/credit-balance'
import { CreditTransaction, CreditTransactionType } from '@domain/entities/credit-transaction'
import { CustomerId } from '@domain/value-objects/customer-id'
import { Money } from '@domain/value-objects/money'
import { ConcurrencyError } from '@shared/errors'
import { v4 as uuidv4 } from 'uuid'

/**
 * Credit Repository Implementation
 * Manages credit balances and transactions using Prisma
 */
export class CreditRepository implements ICreditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCustomerId(customerId: CustomerId): Promise<CreditBalance | null> {
    const record = await this.prisma.creditBalance.findUnique({
      where: { customerId: customerId.value },
    })

    if (!record) {
      return null
    }

    return CreditBalance.reconstitute({
      id: record.id,
      customerId,
      currentBalance: Money.from(record.currentBalance),
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  async create(balance: CreditBalance): Promise<CreditBalance> {
    const record = await this.prisma.creditBalance.create({
      data: {
        id: balance.id,
        customerId: balance.customerId.value,
        currentBalance: balance.currentBalance.amount,
        version: balance.version,
      },
    })

    return CreditBalance.reconstitute({
      id: record.id,
      customerId: balance.customerId,
      currentBalance: Money.from(record.currentBalance),
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  async update(balance: CreditBalance): Promise<CreditBalance> {
    try {
      // Optimistic locking: update only if version matches
      const record = await this.prisma.creditBalance.update({
        where: {
          customerId: balance.customerId.value,
          version: balance.version - 1, // Check previous version
        },
        data: {
          currentBalance: balance.currentBalance.amount,
          version: balance.version,
          updatedAt: new Date(),
        },
      })

      return CreditBalance.reconstitute({
        id: record.id,
        customerId: balance.customerId,
        currentBalance: Money.from(record.currentBalance),
        version: record.version,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    } catch (error) {
      // If update fails due to version mismatch, throw concurrency error
      if ((error as any).code === 'P2025') {
        throw new ConcurrencyError('CreditBalance', balance.customerId.value)
      }
      throw error
    }
  }

  async createTransaction(transaction: CreditTransaction): Promise<CreditTransaction> {
    const record = await this.prisma.creditTransaction.create({
      data: {
        id: transaction.id,
        customerId: transaction.customerId.value,
        type: transaction.type,
        amount: transaction.amount.amount,
        balanceBefore: transaction.balanceBefore.amount,
        balanceAfter: transaction.balanceAfter.amount,
        reason: transaction.reason,
        relatedPurchaseId: transaction.relatedPurchaseId,
        metadata: transaction.metadata as any,
        createdBy: transaction.createdBy,
      },
    })

    return CreditTransaction.reconstitute({
      id: record.id,
      customerId: CustomerId.from(record.customerId),
      type: record.type as CreditTransactionType,
      amount: Money.from(record.amount),
      balanceBefore: Money.from(record.balanceBefore),
      balanceAfter: Money.from(record.balanceAfter),
      reason: record.reason,
      relatedPurchaseId: record.relatedPurchaseId || undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdBy: record.createdBy || undefined,
      createdAt: record.createdAt,
    })
  }

  async getTransactionHistory(
    customerId: CustomerId,
    limit: number = 50,
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    const records = await this.prisma.creditTransaction.findMany({
      where: { customerId: customerId.value },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return records.map((record) =>
      CreditTransaction.reconstitute({
        id: record.id,
        customerId: CustomerId.from(record.customerId),
        type: record.type as CreditTransactionType,
        amount: Money.from(record.amount),
        balanceBefore: Money.from(record.balanceBefore),
        balanceAfter: Money.from(record.balanceAfter),
        reason: record.reason,
        relatedPurchaseId: record.relatedPurchaseId || undefined,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdBy: record.createdBy || undefined,
        createdAt: record.createdAt,
      })
    )
  }

  async getOrCreate(customerId: CustomerId): Promise<CreditBalance> {
    // Try to find existing balance
    const existing = await this.findByCustomerId(customerId)
    if (existing) {
      return existing
    }

    // Create new balance with zero amount
    const newBalance = CreditBalance.create({
      id: uuidv4(),
      customerId,
      initialBalance: Money.zero(),
    })

    return this.create(newBalance)
  }
}
