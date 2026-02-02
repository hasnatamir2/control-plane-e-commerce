import { IPromoCodeRepository } from '@domain/repositories/ipromo-code-repository'
import { PromoCode, PromoCodeStatus, PromoCodeType } from '@domain/entities/promo-code'
import { CreatePromoCodeDto, PromoCodeDto } from '../../dtos/promo-code-dto'
import { ValidationError } from '@shared/errors'

export class CreatePromoCodeUseCase {
  constructor(private readonly promoCodeRepository: IPromoCodeRepository) {}

  async execute(dto: CreatePromoCodeDto): Promise<PromoCodeDto> {
    const existing = await this.promoCodeRepository.findByCode(dto.code)
    if (existing) {
      throw new ValidationError('Promo code already exists', ['code'])
    }

    const promoCode = PromoCode.create({
      code: dto.code,
      type: dto.type as PromoCodeType,
      value: dto.value,
      minPurchaseAmount: dto.minPurchaseAmount,
      maxDiscountAmount: dto.maxDiscountAmount,
      maxUsageCount: dto.maxUsageCount,
      validFrom: dto.validFrom,
      validUntil: dto.validUntil,
      status: PromoCodeStatus.ACTIVE,
      applicableProductIds: dto.applicableProductIds,
    })

    const created = await this.promoCodeRepository.create(promoCode)

    return this.toDto(created)
  }

  private toDto(promoCode: PromoCode): PromoCodeDto {
    return {
      id: promoCode.id,
      code: promoCode.code,
      type: promoCode.type,
      value: promoCode.value,
      minPurchaseAmount: promoCode.minPurchaseAmount,
      maxDiscountAmount: promoCode.maxDiscountAmount,
      maxUsageCount: promoCode.maxUsageCount,
      currentUsageCount: promoCode.currentUsageCount,
      validFrom: promoCode.validFrom.toISOString(),
      validUntil: promoCode.validUntil.toISOString(),
      status: promoCode.status,
      applicableProductIds: promoCode.applicableProductIds,
      createdAt: promoCode.createdAt.toISOString(),
      updatedAt: promoCode.updatedAt.toISOString(),
    }
  }
}
