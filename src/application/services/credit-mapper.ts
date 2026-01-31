import { CreditBalance } from '@domain/entities/credit-balance'
import { CreditTransaction } from '@domain/entities/credit-transaction'
import {
  CreditBalanceDto,
  CreditTransactionDto,
  CreditOperationResultDto,
} from '../dtos/credit-dto'

/**
 * Credit Mapper Application Service
 *
 * Responsible for converting between domain entities and DTOs
 * This ensures the presentation layer only receives plain data objects
 */
export class CreditMapper {
  /**
   * Convert CreditBalance entity to DTO
   */
  static toBalanceDto(balance: CreditBalance): CreditBalanceDto {
    return {
      customerId: balance.customerId.value,
      currentBalance: balance.currentBalance.value,
      lastUpdated: balance.updatedAt,
    }
  }

  /**
   * Convert CreditTransaction entity to DTO
   */
  static toTransactionDto(transaction: CreditTransaction): CreditTransactionDto {
    return {
      id: transaction.id,
      customerId: transaction.customerId.value,
      type: transaction.type,
      amount: transaction.amount.value,
      balanceBefore: transaction.balanceBefore.value,
      balanceAfter: transaction.balanceAfter.value,
      reason: transaction.reason,
      relatedPurchaseId: transaction.relatedPurchaseId,
      metadata: transaction.metadata,
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
    }
  }

  /**
   * Convert operation result to DTO
   */
  static toOperationResultDto(
    balance: CreditBalance,
    transaction: CreditTransaction,
    previousBalance: number
  ): CreditOperationResultDto {
    return {
      customerId: balance.customerId.value,
      previousBalance,
      newBalance: balance.currentBalance.value,
      transactionId: transaction.id,
      timestamp: transaction.createdAt,
    }
  }

  /**
   * Convert multiple transactions to DTOs
   */
  static toTransactionDtos(transactions: CreditTransaction[]): CreditTransactionDto[] {
    return transactions.map((tx) => this.toTransactionDto(tx))
  }
}
