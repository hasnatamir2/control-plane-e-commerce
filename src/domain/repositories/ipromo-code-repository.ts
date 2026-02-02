import { PromoCode, PromoCodeStatus } from '../entities/promo-code'

export interface PromoCodeFilters {
  status?: PromoCodeStatus
  type?: string
  isActive?: boolean
}

export interface IPromoCodeRepository {
  create(promoCode: PromoCode): Promise<PromoCode>
  findByCode(code: string): Promise<PromoCode | null>
  findById(id: string): Promise<PromoCode | null>
  findAll(filters?: PromoCodeFilters): Promise<PromoCode[]>
  update(promoCode: PromoCode): Promise<PromoCode>
  count(filters?: PromoCodeFilters): Promise<number>
  recordUsage(
    promoCodeId: string,
    customerId: string,
    purchaseId: string,
    discountAmount: number
  ): Promise<void>
}
