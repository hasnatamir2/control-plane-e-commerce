import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { CustomerId } from '@domain/value-objects/customer-id'
import { ValidationError } from '@shared/errors'
import { CreditBalanceDto } from '../../dtos/credit-dto'
import { CreditMapper } from '../../services/credit-mapper'

export interface GetBalanceRequest {
  customerId: string
}

/**
 * Get Balance Use Case
 * Retrieves a customer's current credit balance
 */
export class GetBalanceUseCase {
  constructor(private readonly creditRepository: ICreditRepository) {}

  async execute(request: GetBalanceRequest): Promise<CreditBalanceDto> {
    // Validate input
    this.validate(request)

    const customerId = CustomerId.from(request.customerId)

    // Get or create balance
    const balance = await this.creditRepository.getOrCreate(customerId)

    // Map to DTO
    return CreditMapper.toBalanceDto(balance)
  }

  private validate(request: GetBalanceRequest): void {
    if (!request.customerId || request.customerId.trim().length === 0) {
      throw new ValidationError('Invalid get balance request', ['Customer ID is required'])
    }
  }
}
