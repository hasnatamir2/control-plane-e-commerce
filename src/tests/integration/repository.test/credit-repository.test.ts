import { PrismaClient } from '@prisma/client'
import { CreditRepository } from '../../../infrastructure/database/repositories/credit-repository'
import { CreditBalance } from '../../../domain/entities/credit-balance'
import { CreditTransaction, CreditTransactionType } from '../../../domain/entities/credit-transaction'
import { CustomerId } from '../../../domain/value-objects/customer-id'
import { Money } from '../../../domain/value-objects/money'
import { ConcurrencyError } from '../../../shared/errors'
import { v4 as uuidv4 } from 'uuid'

describe('CreditRepository', () => {
  let prisma: PrismaClient
  let repository: CreditRepository
  let testCustomerId: CustomerId

  beforeAll(() => {
    prisma = new PrismaClient()
    repository = new CreditRepository(prisma)
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.creditTransaction.deleteMany()
    await prisma.creditBalance.deleteMany()
    testCustomerId = CustomerId.from(uuidv4())
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('create', () => {
    it('should create a new credit balance', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(1000),
      })

      const created = await repository.create(balance)

      expect(created.id).toBe(balance.id)
      expect(created.customerId.value).toBe(testCustomerId.value)
      expect(created.currentBalance.value).toBe(1000)
      expect(created.version).toBe(0)
    })
  })

  describe('findByCustomerId', () => {
    it('should find existing credit balance', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(500),
      })

      await repository.create(balance)
      const found = await repository.findByCustomerId(testCustomerId)

      expect(found).not.toBeNull()
      expect(found?.customerId.value).toBe(testCustomerId.value)
      expect(found?.currentBalance.value).toBe(500)
    })

    it('should return null for non-existent customer', async () => {
      const nonExistentId = CustomerId.from(uuidv4())
      const found = await repository.findByCustomerId(nonExistentId)

      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update credit balance with optimistic locking', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(1000),
      })

      await repository.create(balance)

      // Update balance
      balance.debit(Money.from(100))
      const updated = await repository.update(balance)

      expect(updated.currentBalance.value).toBe(900)
      expect(updated.version).toBe(1)
    })

    it('should throw ConcurrencyError on version mismatch', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(1000),
      })

      await repository.create(balance)

      // Simulate concurrent update by updating version in database
      await prisma.creditBalance.update({
        where: { customerId: testCustomerId.value },
        data: { version: 5 },
      })

      // Try to update with old version
      balance.debit(Money.from(100))

      await expect(repository.update(balance)).rejects.toThrow(ConcurrencyError)
    })
  })

  describe('createTransaction', () => {
    it('should create a credit transaction', async () => {
      const transaction = CreditTransaction.create({
        customerId: testCustomerId,
        type: CreditTransactionType.GRANT,
        amount: Money.from(500),
        balanceBefore: Money.zero(),
        balanceAfter: Money.from(500),
        reason: 'Initial grant',
        createdBy: 'admin',
      })

      const created = await repository.createTransaction(transaction)

      expect(created.id).toBe(transaction.id)
      expect(created.amount.value).toBe(500)
      expect(created.type).toBe(CreditTransactionType.GRANT)
    })
  })

  describe('getTransactionHistory', () => {
    it('should return transaction history for customer', async () => {
      // Create balance
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(1000),
      })
      await repository.create(balance)

      // Create multiple transactions
      const tx1 = CreditTransaction.create({
        customerId: testCustomerId,
        type: CreditTransactionType.GRANT,
        amount: Money.from(1000),
        balanceBefore: Money.zero(),
        balanceAfter: Money.from(1000),
        reason: 'Initial grant',
      })

      const tx2 = CreditTransaction.create({
        customerId: testCustomerId,
        type: CreditTransactionType.DEDUCT,
        amount: Money.from(100),
        balanceBefore: Money.from(1000),
        balanceAfter: Money.from(900),
        reason: 'Purchase',
      })

      await repository.createTransaction(tx1)
      await repository.createTransaction(tx2)

      const history = await repository.getTransactionHistory(testCustomerId)

      expect(history).toHaveLength(2)
      expect(history[0].type).toBe(CreditTransactionType.DEDUCT) // Most recent first
      expect(history[1].type).toBe(CreditTransactionType.GRANT)
    })

    it('should support pagination', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.zero(),
      })
      await repository.create(balance)

      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        const tx = CreditTransaction.create({
          customerId: testCustomerId,
          type: CreditTransactionType.GRANT,
          amount: Money.from(100),
          balanceBefore: Money.from(i * 100),
          balanceAfter: Money.from((i + 1) * 100),
          reason: `Grant ${i}`,
        })
        await repository.createTransaction(tx)
      }

      const page1 = await repository.getTransactionHistory(testCustomerId, 2, 0)
      const page2 = await repository.getTransactionHistory(testCustomerId, 2, 2)

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(2)
    })
  })

  describe('getOrCreate', () => {
    it('should return existing balance if found', async () => {
      const balance = CreditBalance.create({
        id: uuidv4(),
        customerId: testCustomerId,
        initialBalance: Money.from(500),
      })

      await repository.create(balance)
      const result = await repository.getOrCreate(testCustomerId)

      expect(result.currentBalance.value).toBe(500)
    })

    it('should create new balance if not found', async () => {
      const result = await repository.getOrCreate(testCustomerId)

      expect(result.customerId.value).toBe(testCustomerId.value)
      expect(result.currentBalance.value).toBe(0)
    })
  })
})
