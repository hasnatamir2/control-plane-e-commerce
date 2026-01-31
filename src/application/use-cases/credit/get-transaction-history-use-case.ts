import { ICreditRepository } from '@domain/repositories/icredit-repository'
import { CustomerId } from '@domain/value-objects/customer-id'
import { ValidationError } from '@shared/errors'
import { CreditTransactionDto } from '../../dtos/credit-dto'
import { CreditMapper } from '../../services/credit-mapper'

export interface GetTransactionHistoryRequest {
  customerId: string
  limit?: number
  offset?: number
}

export interface GetTransactionHistoryResponse {
  customerId: string
  transactions: CreditTransactionDto[]
  pagination: {
    limit: number
    offset: number
  }
}

/**
 * Get Transaction History Use Case
 * Retrieves a customer's credit transaction history
 */
export class GetTransactionHistoryUseCase {
  constructor(private readonly creditRepository: ICreditRepository) {}

  async execute(request: GetTransactionHistoryRequest): Promise<GetTransactionHistoryResponse> {
    // Validate input
    this.validate(request)

    const customerId = CustomerId.from(request.customerId)
    const limit = request.limit || 50
    const offset = request.offset || 0

    // Get transaction history
    const transactions = await this.creditRepository.getTransactionHistory(
      customerId,
      limit,
      offset
    )

    return {
      customerId: request.customerId,
      transactions: CreditMapper.toTransactionDtos(transactions),
      pagination: {
        limit,
        offset,
      },
    }
  }

  private validate(request: GetTransactionHistoryRequest): void {
    const errors: string[] = []

    if (!request.customerId || request.customerId.trim().length === 0) {
      errors.push('Customer ID is required')
    }

    if (request.limit !== undefined && request.limit <= 0) {
      errors.push('Limit must be greater than 0')
    }

    if (request.offset !== undefined && request.offset < 0) {
      errors.push('Offset must be 0 or greater')
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid get transaction history request', errors)
    }
  }
}
