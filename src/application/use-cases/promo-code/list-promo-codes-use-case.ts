import { PromoCodeStatus, PromoCodeType } from '@domain/entities/promo-code'
import { IPromoCodeRepository } from '@domain/repositories/ipromo-code-repository'
import { PromoCodeDto } from '../../dtos/promo-code-dto'
import { toPromoCodeDto } from '../../services/promo-code-mapper'

export interface ListPromoCodesFilters {
  status?: PromoCodeStatus
  type?: PromoCodeType
  isActive?: boolean
}

export class ListPromoCodesUseCase {
  constructor(private readonly promoCodeRepository: IPromoCodeRepository) {}

  async execute(filters?: ListPromoCodesFilters): Promise<PromoCodeDto[]> {
    const promoCodes = await this.promoCodeRepository.findAll(filters)
    return promoCodes.map((promoCode) => toPromoCodeDto(promoCode))
  }
}
