import { IPurchaseRepository } from '@domain/repositories/ipurchase-repository';
import { ValidationError, NotFoundError } from '@shared/errors';
import { PurchaseDetailDto } from '../../dtos/purchase-dto';
import { PurchaseMapper } from '../../services/purchase-mapper';

export interface GetPurchaseRequest {
  purchaseId: string;
}

/**
 * Get Purchase Use Case
 * Retrieves a single purchase with its refund history
 */
export class GetPurchaseUseCase {
  constructor(private readonly purchaseRepository: IPurchaseRepository) {}

  async execute(request: GetPurchaseRequest): Promise<PurchaseDetailDto> {
    // Validate input
    this.validate(request);

    // Get purchase
    const purchase = await this.purchaseRepository.findById(request.purchaseId);
    if (!purchase) {
      throw new NotFoundError('Purchase', request.purchaseId);
    }

    // Get refunds
    const refunds = await this.purchaseRepository.getRefunds(purchase.id);

    // Map to detailed DTO
    return PurchaseMapper.toPurchaseDetailDto(purchase, refunds);
  }

  private validate(request: GetPurchaseRequest): void {
    if (!request.purchaseId || request.purchaseId.trim().length === 0) {
      throw new ValidationError('Invalid get purchase request', ['Purchase ID is required']);
    }
  }
}