import { IPurchaseRepository } from '@domain/repositories/ipurchase-repository';
import { CustomerId } from '@domain/value-objects/customer-id';
import { ValidationError } from '../../../shared/errors';
import { PurchaseListDto } from '../../dtos/purchase-dto';
import { PurchaseMapper } from '../../services/purchase-mapper';

export interface ListPurchasesRequest {
  customerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * List Purchases Use Case
 * Retrieves purchases with optional filtering and pagination
 */
export class ListPurchasesUseCase {
  constructor(private readonly purchaseRepository: IPurchaseRepository) {}

  async execute(request: ListPurchasesRequest): Promise<PurchaseListDto> {
    // Validate input
    this.validate(request);

    const limit = request.limit || 50;
    const offset = request.offset || 0;

    let purchases;
    let total;

    if (request.customerId) {
      // Filter by customer
      const customerId = CustomerId.from(request.customerId);
      purchases = await this.purchaseRepository.findByCustomerId(customerId, limit, offset);
      total = await this.purchaseRepository.count({ customerId: request.customerId });
    } else {
      // Get all with optional status filter
      purchases = await this.purchaseRepository.findAll({
        limit,
        offset,
        status: request.status,
      });
      total = await this.purchaseRepository.count({ status: request.status });
    }

    // Map to DTO with pagination
    return PurchaseMapper.toPurchaseListDto(purchases, total, limit, offset);
  }

  private validate(request: ListPurchasesRequest): void {
    const errors: string[] = [];

    if (request.limit !== undefined && request.limit <= 0) {
      errors.push('Limit must be greater than 0');
    }

    if (request.offset !== undefined && request.offset < 0) {
      errors.push('Offset must be 0 or greater');
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid list purchases request', errors);
    }
  }
}