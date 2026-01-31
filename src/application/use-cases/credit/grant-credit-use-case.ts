import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { CreditTransactionType } from '@domain/entities/credit-transaction'
import { CreditDomainService } from '@domain/services/credit-domain-service'
import { CustomerId } from '@domain/value-objects/customer-id'
import { Money } from '@domain/value-objects/money'
import { ValidationError } from '@shared/errors'
import { GrantCreditDto, CreditOperationResultDto } from '../../dtos/credit-dto'
import { CreditMapper } from '../../services/credit-mapper'

/**
 * Grant Credit Use Case
 * Adds credit to a customer's balance using domain service
 */
export class GrantCreditUseCase {
  constructor(private readonly creditRepository: ICreditRepository) {}

  async execute(request: GrantCreditDto): Promise<CreditOperationResultDto> {
    // Validate input
    this.validate(request)

    const customerId = CustomerId.from(request.customerId)
    const amount = Money.from(request.amount)

    // Get or create credit balance
    const balance = await this.creditRepository.getOrCreate(customerId)
    const previousBalance = balance.currentBalance.value

    // Use domain service to execute the operation
    const { balance: updatedBalance, transaction } = CreditDomainService.executeOperation(
      balance,
      CreditTransactionType.GRANT,
      amount,
      request.reason,
      undefined,
      request.metadata,
      request.createdBy
    )

    // Save balance
    await this.creditRepository.update(updatedBalance)

    // Save transaction record
    await this.creditRepository.createTransaction(transaction)

    // Map to DTO
    return CreditMapper.toOperationResultDto(updatedBalance, transaction, previousBalance)
  }

  private validate(request: GrantCreditDto): void {
    const errors: string[] = []

    if (!request.customerId || request.customerId.trim().length === 0) {
      errors.push('Customer ID is required')
    }

    if (request.amount <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (!request.reason || request.reason.trim().length === 0) {
      errors.push('Reason is required')
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid grant credit request', errors)
    }
  }
}
