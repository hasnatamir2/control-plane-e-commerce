import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { CreditTransactionType } from '@domain/entities/credit-transaction'
import { CreditDomainService } from '@domain/services/credit-domain-service'
import { CustomerId } from '@domain/value-objects/customer-id'
import { Money } from '@domain/value-objects/money'
import { ValidationError, InsufficientCreditError } from '@shared/errors'
import { DeductCreditDto, CreditOperationResultDto } from '../../dtos/credit-dto'
import { CreditMapper } from '../../services/credit-mapper'

/**
 * Deduct Credit Use Case
 * Removes credit from a customer's balance using domain service
 */
export class DeductCreditUseCase {
  constructor(private readonly creditRepository: ICreditRepository) {}

  async execute(dto: DeductCreditDto): Promise<CreditOperationResultDto> {
    // Validate input
    this.validate(dto)

    const customerId = CustomerId.from(dto.customerId)
    const amount = Money.from(dto.amount)

    // Get credit balance
    const balance = await this.creditRepository.getOrCreate(customerId)
    const previousBalance = balance.currentBalance.value

    // Check sufficient balance using domain service
    if (!CreditDomainService.canAffordPurchase(balance, amount)) {
      throw new InsufficientCreditError(
        customerId.value,
        amount.toString(),
        balance.currentBalance.toString()
      )
    }

    // Use domain service to execute the operation
    const { balance: updatedBalance, transaction } = CreditDomainService.executeOperation(
      balance,
      CreditTransactionType.DEDUCT,
      amount,
      dto.reason,
      undefined,
      dto.metadata,
      dto.createdBy
    )

    // Save balance
    await this.creditRepository.update(updatedBalance)

    // Save transaction record
    await this.creditRepository.createTransaction(transaction)

    // Map to DTO
    return CreditMapper.toOperationResultDto(updatedBalance, transaction, previousBalance)
  }

  private validate(dto: DeductCreditDto): void {
    const errors: string[] = []

    if (!dto.customerId || dto.customerId.trim().length === 0) {
      errors.push('Customer ID is required')
    }

    if (dto.amount <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      errors.push('Reason is required')
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid deduct credit request', errors)
    }
  }
}
