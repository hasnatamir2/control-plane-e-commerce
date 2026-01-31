import { Purchase, PurchaseStatus } from '../entities/purchase'
import { Money } from '../value-objects/money'

/**
 * Purchase Domain Service
 *
 * Contains business logic for purchase operations that involve
 * complex rules or multiple entities
 */
export class PurchaseDomainService {
  /**
   * Validate if a purchase can be refunded
   */
  static canBeRefunded(purchase: Purchase): { canRefund: boolean; reason?: string } {
    if (purchase.status === PurchaseStatus.PENDING) {
      return { canRefund: false, reason: 'Purchase is still pending' }
    }

    if (purchase.status === PurchaseStatus.CANCELLED) {
      return { canRefund: false, reason: 'Purchase was cancelled' }
    }

    if (purchase.status === PurchaseStatus.FULLY_REFUNDED) {
      return { canRefund: false, reason: 'Purchase is already fully refunded' }
    }

    if (purchase.getRemainingAmount().isZero()) {
      return { canRefund: false, reason: 'No remaining amount to refund' }
    }

    return { canRefund: true }
  }

  /**
   * Validate refund amount
   */
  static validateRefundAmount(
    purchase: Purchase,
    refundAmount: Money
  ): { isValid: boolean; reason?: string } {
    const remaining = purchase.getRemainingAmount()

    if (refundAmount.isZero() || refundAmount.value <= 0) {
      return { isValid: false, reason: 'Refund amount must be greater than zero' }
    }

    if (refundAmount.isGreaterThan(remaining)) {
      return {
        isValid: false,
        reason: `Refund amount (${refundAmount.value}) exceeds remaining amount (${remaining.value})`,
      }
    }

    return { isValid: true }
  }

  /**
   * Calculate refund percentage
   */
  static calculateRefundPercentage(purchase: Purchase, refundAmount: Money): number {
    return (refundAmount.value / purchase.totalAmount.value) * 100
  }

  /**
   * Determine if this will be a full refund
   */
  static isFullRefund(purchase: Purchase, refundAmount: Money): boolean {
    const afterRefund = purchase.getRemainingAmount().subtract(refundAmount)
    return afterRefund.isZero()
  }

  /**
   * Check if purchase requires special approval (e.g., high value)
   */
  static requiresApproval(totalAmount: Money, threshold: Money = Money.from(1000)): boolean {
    return totalAmount.isGreaterThan(threshold)
  }
}
