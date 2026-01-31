import { CreditBalance } from '../entities/credit-balance'
import { CreditTransaction, CreditTransactionType } from '../entities/credit-transaction'
import { Money } from '../value-objects/money'

/**
 * Credit Domain Service
 *
 * Handles complex business logic that spans multiple entities
 * or doesn't naturally belong to a single entity
 */
export class CreditDomainService {
  /**
   * Execute a credit operation (grant or deduct) with automatic transaction creation
   * Returns both the updated balance and the transaction record
   */
  static executeOperation(
    balance: CreditBalance,
    type: CreditTransactionType,
    amount: Money,
    reason: string,
    relatedPurchaseId?: string,
    metadata?: Record<string, unknown>,
    createdBy?: string
  ): { balance: CreditBalance; transaction: CreditTransaction } {
    const balanceBefore = balance.currentBalance

    // Apply the operation to the balance
    switch (type) {
      case CreditTransactionType.GRANT:
      case CreditTransactionType.REFUND:
        balance.credit(amount)
        break
      case CreditTransactionType.DEDUCT:
        balance.debit(amount)
        break
      default:
        throw new Error(`Unknown transaction type: ${type}`)
    }

    const balanceAfter = balance.currentBalance

    // Create transaction record
    const transaction = CreditTransaction.create({
      customerId: balance.customerId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      reason,
      relatedPurchaseId,
      metadata,
      createdBy,
    })

    return { balance, transaction }
  }

  /**
   * Check if customer has sufficient credit for a purchase
   */
  static canAffordPurchase(balance: CreditBalance, totalAmount: Money): boolean {
    return balance.hasSufficientBalance(totalAmount)
  }

  /**
   * Calculate what percentage of balance would be used
   */
  static calculateUsagePercentage(balance: CreditBalance, amount: Money): number {
    if (balance.currentBalance.isZero()) {
      return 0
    }
    return (amount.value / balance.currentBalance.value) * 100
  }
}
