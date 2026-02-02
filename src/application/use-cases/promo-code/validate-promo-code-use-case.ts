import { IPromoCodeRepository } from '@domain/repositories/ipromo-code-repository'
import { ValidatePromoCodeDto, PromoCodeValidationDto } from '../../dtos/promo-code-dto'

export class ValidatePromoCodeUseCase {
  constructor(private readonly promoCodeRepository: IPromoCodeRepository) {}

  async execute(dto: ValidatePromoCodeDto): Promise<PromoCodeValidationDto> {
    const promoCode = await this.promoCodeRepository.findByCode(dto.code)

    if (!promoCode) {
      return {
        valid: false,
        message: 'Promo code not found',
      }
    }

    const validationMessage = promoCode.getValidationMessage()
    if (validationMessage) {
      return {
        valid: false,
        message: validationMessage,
      }
    }

    if (!promoCode.meetsMinimumPurchase(dto.purchaseAmount)) {
      return {
        valid: false,
        message: `Minimum purchase amount is $${promoCode.minPurchaseAmount}`,
      }
    }

    if (dto.productId && !promoCode.canApplyToProduct(dto.productId)) {
      return {
        valid: false,
        message: 'Promo code not applicable to this product',
      }
    }

    const discountAmount = promoCode.calculateDiscount(dto.purchaseAmount)

    return {
      valid: true,
      code: promoCode.code,
      discountAmount,
    }
  }
}
