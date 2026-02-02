import { PromoCode } from '@domain/entities/promo-code'
import { PromoCodeDto } from '../dtos/promo-code-dto'

export const toPromoCodeDto = (promoCode: PromoCode): PromoCodeDto => ({
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
})
