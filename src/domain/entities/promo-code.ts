import { v4 as uuidv4 } from 'uuid'

export enum PromoCodeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum PromoCodeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
  USED_UP = 'USED_UP',
}

interface PromoCodeProps {
  id?: string
  code: string
  type: PromoCodeType
  value: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  maxUsageCount?: number
  currentUsageCount: number
  validFrom: Date
  validUntil: Date
  status: PromoCodeStatus
  applicableProductIds?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export class PromoCode {
  public readonly id: string
  public readonly code: string
  public readonly type: PromoCodeType
  public readonly value: number
  public readonly minPurchaseAmount?: number
  public readonly maxDiscountAmount?: number
  public readonly maxUsageCount?: number
  public currentUsageCount: number
  public readonly validFrom: Date
  public readonly validUntil: Date
  public status: PromoCodeStatus
  public readonly applicableProductIds?: string[]
  public readonly createdAt: Date
  public updatedAt: Date

  private constructor(props: PromoCodeProps) {
    this.id = props.id || uuidv4()
    this.code = props.code.toUpperCase()
    this.type = props.type
    this.value = props.value
    this.minPurchaseAmount = props.minPurchaseAmount
    this.maxDiscountAmount = props.maxDiscountAmount
    this.maxUsageCount = props.maxUsageCount
    this.currentUsageCount = props.currentUsageCount
    this.validFrom = props.validFrom
    this.validUntil = props.validUntil
    this.status = props.status
    this.applicableProductIds = props.applicableProductIds
    this.createdAt = props.createdAt || new Date()
    this.updatedAt = props.updatedAt || new Date()

    this.validate()
  }

  static create(
    props: Omit<PromoCodeProps, 'id' | 'currentUsageCount' | 'createdAt' | 'updatedAt'>
  ): PromoCode {
    return new PromoCode({
      ...props,
      currentUsageCount: 0,
    })
  }

  static reconstitute(props: PromoCodeProps): PromoCode {
    return new PromoCode(props)
  }

  private validate(): void {
    if (!this.code || this.code.trim().length === 0) {
      throw new Error('Promo code cannot be empty')
    }

    if (this.code.length < 3 || this.code.length > 50) {
      throw new Error('Promo code must be between 3 and 50 characters')
    }

    if (this.type === PromoCodeType.PERCENTAGE && (this.value <= 0 || this.value > 100)) {
      throw new Error('Percentage discount must be between 0 and 100')
    }

    if (this.type === PromoCodeType.FIXED_AMOUNT && this.value <= 0) {
      throw new Error('Fixed amount discount must be greater than 0')
    }

    if (this.minPurchaseAmount !== undefined && this.minPurchaseAmount < 0) {
      throw new Error('Minimum purchase amount cannot be negative')
    }

    if (this.maxDiscountAmount !== undefined && this.maxDiscountAmount <= 0) {
      throw new Error('Maximum discount amount must be greater than 0')
    }

    if (this.maxUsageCount !== undefined && this.maxUsageCount <= 0) {
      throw new Error('Maximum usage count must be greater than 0')
    }

    if (this.validFrom >= this.validUntil) {
      throw new Error('Valid from date must be before valid until date')
    }
  }

  /**
   * Check if promo code is currently valid
   */
  isValid(): boolean {
    const now = new Date()

    if (this.status !== PromoCodeStatus.ACTIVE) {
      return false
    }

    if (now < this.validFrom || now > this.validUntil) {
      return false
    }

    if (this.maxUsageCount !== undefined && this.currentUsageCount >= this.maxUsageCount) {
      return false
    }

    return true
  }

  /**
   * Get validation message if code is invalid
   */
  getValidationMessage(): string | null {
    const now = new Date()

    if (this.status === PromoCodeStatus.DISABLED) {
      return 'Promo code is disabled'
    }

    if (this.status === PromoCodeStatus.EXPIRED) {
      return 'Promo code has expired'
    }

    if (this.status === PromoCodeStatus.USED_UP) {
      return 'Promo code usage limit reached'
    }

    if (now < this.validFrom) {
      return 'Promo code is not yet valid'
    }

    if (now > this.validUntil) {
      return 'Promo code has expired'
    }

    if (this.maxUsageCount !== undefined && this.currentUsageCount >= this.maxUsageCount) {
      return 'Promo code usage limit reached'
    }

    return null
  }

  /**
   * Check if promo code can be applied to a specific product
   */
  canApplyToProduct(productId: string): boolean {
    if (!this.applicableProductIds || this.applicableProductIds.length === 0) {
      return true // Applies to all products
    }

    return this.applicableProductIds.includes(productId)
  }

  /**
   * Calculate discount amount for a purchase
   */
  calculateDiscount(purchaseAmount: number): number {
    if (!this.isValid()) {
      return 0
    }

    if (this.minPurchaseAmount !== undefined && purchaseAmount < this.minPurchaseAmount) {
      return 0
    }

    let discount = 0

    if (this.type === PromoCodeType.PERCENTAGE) {
      discount = (purchaseAmount * this.value) / 100
    } else {
      discount = this.value
    }

    // Apply max discount cap if specified
    if (this.maxDiscountAmount !== undefined && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount
    }

    // Discount cannot exceed purchase amount
    if (discount > purchaseAmount) {
      discount = purchaseAmount
    }

    return Math.round(discount * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Increment usage count
   */
  incrementUsage(): void {
    this.currentUsageCount += 1
    this.updatedAt = new Date()

    // Auto-update status if max usage reached
    if (this.maxUsageCount !== undefined && this.currentUsageCount >= this.maxUsageCount) {
      this.status = PromoCodeStatus.USED_UP
    }
  }

  /**
   * Disable promo code
   */
  disable(): void {
    this.status = PromoCodeStatus.DISABLED
    this.updatedAt = new Date()
  }

  /**
   * Activate promo code
   */
  activate(): void {
    if (this.status === PromoCodeStatus.EXPIRED || this.status === PromoCodeStatus.USED_UP) {
      throw new Error('Cannot activate expired or used up promo code')
    }
    this.status = PromoCodeStatus.ACTIVE
    this.updatedAt = new Date()
  }

  /**
   * Mark as expired
   */
  markAsExpired(): void {
    this.status = PromoCodeStatus.EXPIRED
    this.updatedAt = new Date()
  }

  /**
   * Check if code meets minimum purchase requirement
   */
  meetsMinimumPurchase(amount: number): boolean {
    if (!this.minPurchaseAmount) {
      return true
    }
    return amount >= this.minPurchaseAmount
  }
}
