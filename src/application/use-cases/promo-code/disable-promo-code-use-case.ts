import { PromoCodeDto } from '../../dtos/promo-code-dto'
import { IPromoCodeRepository } from '@domain/repositories/ipromo-code-repository'
import { toPromoCodeDto } from '../../mappers/promo-code-mapper'
import { NotFoundError } from '@shared/errors'

export class DisablePromoCodeUseCase {
  constructor(private readonly promoCodeRepository: IPromoCodeRepository) {}

  async execute(id: string): Promise<PromoCodeDto> {
    const promoCode = await this.promoCodeRepository.findById(id)

    if (!promoCode) {
      throw new NotFoundError('Promo code not found', id)
    }

    promoCode.disable()

    const updated = await this.promoCodeRepository.update(promoCode)

    return toPromoCodeDto(updated)
  }
}
