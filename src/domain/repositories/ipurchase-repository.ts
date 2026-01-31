import { Purchase } from '@domain/entities/purchase'
import { Refund } from '@domain/entities/refund'
import { CustomerId } from '@domain/value-objects/customer-id'
import { ProductId } from '@domain/value-objects/product-id'

/**
 * Purchase Repository Interface
 * Handles purchase and refund operations
 */
export interface IPurchaseRepository {
  /**
   * Create a new purchase
   */
  create(purchase: Purchase): Promise<Purchase>

  /**
   * Find purchase by ID
   * Returns null if not found
   */
  findById(id: string): Promise<Purchase | null>

  /**
   * Find all purchases by customer ID
   */
  findByCustomerId(customerId: CustomerId, limit?: number, offset?: number): Promise<Purchase[]>

  /**
   * Find all purchases by product ID
   */
  findByProductId(productId: ProductId, limit?: number, offset?: number): Promise<Purchase[]>

  /**
   * Get all purchases with optional filtering
   */
  findAll(options?: { limit?: number; offset?: number; status?: string }): Promise<Purchase[]>

  /**
   * Update an existing purchase
   */
  update(purchase: Purchase): Promise<Purchase>

  /**
   * Create a refund for a purchase
   */
  createRefund(refund: Refund): Promise<Refund>

  /**
   * Get all refunds for a purchase
   */
  getRefunds(purchaseId: string): Promise<Refund[]>

  /**
   * Count total purchases (for pagination)
   */
  count(filters?: { customerId?: string; status?: string }): Promise<number>
}
