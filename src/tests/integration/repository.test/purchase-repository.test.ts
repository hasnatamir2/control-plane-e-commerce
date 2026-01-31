import { PrismaClient } from '@prisma/client'
import { PurchaseRepository } from '../../../infrastructure/database/repositories/purchase-repository'
import { Purchase, PurchaseStatus } from '../../../domain/entities/purchase'
import { Refund } from '../../../domain/entities/refund'
import { CustomerId } from '../../../domain/value-objects/customer-id'
import { ProductId } from '../../../domain/value-objects/product-id'
import { Money } from '../../../domain/value-objects/money'
import { v4 as uuidv4 } from 'uuid'

describe('PurchaseRepository', () => {
  let prisma: PrismaClient
  let repository: PurchaseRepository
  let testCustomerId: CustomerId
  let testProductId: ProductId

  beforeAll(() => {
    prisma = new PrismaClient()
    repository = new PurchaseRepository(prisma)
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.refund.deleteMany()
    await prisma.purchase.deleteMany()

    testCustomerId = CustomerId.from(uuidv4())
    testProductId = ProductId.from(uuidv4())
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('create', () => {
    it('should create a new purchase', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 2,
        unitPrice: Money.from(49.99),
        productSnapshot: {
          id: testProductId.value,
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'Test description',
          price: 49.99,
          createdAt: Date.now(),
          lastModifiedAt: Date.now(),
        },
      })

      const created = await repository.create(purchase)

      expect(created.id).toBe(purchase.id)
      expect(created.customerId.value).toBe(testCustomerId.value)
      expect(created.quantity).toBe(2)
      expect(created.totalAmount.value).toBe(99.98)
      expect(created.status).toBe(PurchaseStatus.PENDING)
    })
  })

  describe('findById', () => {
    it('should find purchase by ID', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase)
      const found = await repository.findById(purchase.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(purchase.id)
    })

    it('should return null for non-existent purchase', async () => {
      const found = await repository.findById(uuidv4())
      expect(found).toBeNull()
    })
  })

  describe('findByCustomerId', () => {
    it('should find all purchases for a customer', async () => {
      const purchase1 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(50),
      })

      const purchase2 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 2,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase1)
      await repository.create(purchase2)

      const purchases = await repository.findByCustomerId(testCustomerId)

      expect(purchases).toHaveLength(2)
      expect(purchases[0].customerId.value).toBe(testCustomerId.value)
    })

    it('should support pagination', async () => {
      // Create 5 purchases
      for (let i = 0; i < 5; i++) {
        const purchase = Purchase.create({
          customerId: testCustomerId,
          productId: testProductId,
          quantity: 1,
          unitPrice: Money.from(10),
        })
        await repository.create(purchase)
      }

      const page1 = await repository.findByCustomerId(testCustomerId, 2, 0)
      const page2 = await repository.findByCustomerId(testCustomerId, 2, 2)

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(2)
    })
  })

  describe('update', () => {
    it('should update purchase status and shipment ID', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase)

      // Complete the purchase
      purchase.complete('shipment-123')
      const updated = await repository.update(purchase)

      expect(updated.status).toBe(PurchaseStatus.COMPLETED)
      expect(updated.shipmentId).toBe('shipment-123')
    })

    it('should update refunded amount', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 2,
        unitPrice: Money.from(50),
      })

      await repository.create(purchase)
      purchase.complete('shipment-123')
      await repository.update(purchase)

      // Refund partial amount
      purchase.refund(Money.from(50))
      const updated = await repository.update(purchase)

      expect(updated.refundedAmount.value).toBe(50)
      expect(updated.status).toBe(PurchaseStatus.PARTIALLY_REFUNDED)
    })
  })

  describe('createRefund', () => {
    it('should create a refund for a purchase', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase)

      const refund = Refund.create({
        purchaseId: purchase.id,
        amount: Money.from(50),
        reason: 'Customer not satisfied',
        refundedBy: 'cs-rep-123',
      })

      const created = await repository.createRefund(refund)

      expect(created.id).toBe(refund.id)
      expect(created.purchaseId).toBe(purchase.id)
      expect(created.amount.value).toBe(50)
    })
  })

  describe('getRefunds', () => {
    it('should get all refunds for a purchase', async () => {
      const purchase = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase)

      const refund1 = Refund.create({
        purchaseId: purchase.id,
        amount: Money.from(30),
        reason: 'Partial refund 1',
      })

      const refund2 = Refund.create({
        purchaseId: purchase.id,
        amount: Money.from(20),
        reason: 'Partial refund 2',
      })

      await repository.createRefund(refund1)
      await repository.createRefund(refund2)

      const refunds = await repository.getRefunds(purchase.id)

      expect(refunds).toHaveLength(2)
      expect(refunds[0].amount.value).toBe(20) // Most recent first
      expect(refunds[1].amount.value).toBe(30)
    })
  })

  describe('count', () => {
    it('should count all purchases', async () => {
      const purchase1 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(50),
      })

      const purchase2 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase1)
      await repository.create(purchase2)

      const count = await repository.count()
      expect(count).toBe(2)
    })

    it('should count purchases by customer', async () => {
      const customer2 = CustomerId.from(uuidv4())

      const purchase1 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(50),
      })

      const purchase2 = Purchase.create({
        customerId: customer2,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase1)
      await repository.create(purchase2)

      const count = await repository.count({ customerId: testCustomerId.value })
      expect(count).toBe(1)
    })
  })

  describe('findAll', () => {
    it('should find all purchases with filtering', async () => {
      const purchase1 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(50),
      })

      const purchase2 = Purchase.create({
        customerId: testCustomerId,
        productId: testProductId,
        quantity: 1,
        unitPrice: Money.from(100),
      })

      await repository.create(purchase1)
      purchase1.complete('ship-1')
      await repository.update(purchase1)

      await repository.create(purchase2)

      const completed = await repository.findAll({ status: PurchaseStatus.COMPLETED })
      expect(completed).toHaveLength(1)

      const pending = await repository.findAll({ status: PurchaseStatus.PENDING })
      expect(pending).toHaveLength(1)
    })
  })
})
