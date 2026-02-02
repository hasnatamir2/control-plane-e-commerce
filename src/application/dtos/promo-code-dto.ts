// Input DTOs
export interface CreatePromoCodeDto {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  maxUsageCount?: number
  validFrom: Date
  validUntil: Date
  applicableProductIds?: string[]
}

export interface ValidatePromoCodeDto {
  code: string
  purchaseAmount: number
  productId?: string
}

// Output DTOs
export interface PromoCodeDto {
  id: string
  code: string
  type: string
  value: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  maxUsageCount?: number
  currentUsageCount: number
  validFrom: string
  validUntil: string
  status: string
  applicableProductIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface PromoCodeValidationDto {
  valid: boolean
  code?: string
  discountAmount?: number
  message?: string
}
