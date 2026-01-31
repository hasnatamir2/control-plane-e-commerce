import { CreditBalance } from '@domain/entities/credit-balance'
import { CreditTransaction } from '@domain/entities/credit-transaction'
import { CustomerId } from '@domain/value-objects/customer-id'

/**
 * Credit Repository Interface
 * Handles credit balance and transaction operations
 */
export interface ICreditRepository {
  /**
   * Find credit balance by customer ID
   * Returns null if not found
   */
  findByCustomerId(customerId: CustomerId): Promise<CreditBalance | null>

  /**
   * Create a new credit balance for a customer
   */
  create(balance: CreditBalance): Promise<CreditBalance>

  /**
   * Update credit balance with optimistic locking
   * Throws ConcurrencyError if version mismatch
   */
  update(balance: CreditBalance): Promise<CreditBalance>

  /**
   * Create a credit transaction record (audit trail)
   */
  createTransaction(transaction: CreditTransaction): Promise<CreditTransaction>

  /**
   * Get transaction history for a customer
   */
  getTransactionHistory(
    customerId: CustomerId,
    limit?: number,
    offset?: number
  ): Promise<CreditTransaction[]>

  /**
   * Get or create credit balance for a customer
   * If balance doesn't exist, creates one with zero balance
   */
  getOrCreate(customerId: CustomerId): Promise<CreditBalance>
}
