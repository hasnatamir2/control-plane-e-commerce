import { Request, Response } from 'express'
import { CreatePromoCodeUseCase } from '@application/use-cases/promo-code/create-promo-code-use-case'
import { ValidatePromoCodeUseCase } from '@application/use-cases/promo-code/validate-promo-code-use-case'
import { ListPromoCodesUseCase } from '@application/use-cases/promo-code/list-promo-codes-use-case'
import { DisablePromoCodeUseCase } from '@application/use-cases/promo-code/disable-promo-code-use-case'
import { PromoCodeStatus, PromoCodeType } from '@domain/entities/promo-code'
import { Logger } from '@shared/utils/logger'

export class PromoCodeController {
  constructor(
    private readonly createPromoCodeUseCase: CreatePromoCodeUseCase,
    private readonly validatePromoCodeUseCase: ValidatePromoCodeUseCase,
    private readonly listPromoCodesUseCase: ListPromoCodesUseCase,
    private readonly disablePromoCodeUseCase: DisablePromoCodeUseCase
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    Logger.info('Create promo code request', { body: req.body })
    const result = await this.createPromoCodeUseCase.execute({
      code: req.body.code,
      type: req.body.type,
      value: req.body.value,
      minPurchaseAmount: req.body.minPurchaseAmount,
      maxDiscountAmount: req.body.maxDiscountAmount,
      maxUsageCount: req.body.maxUsageCount,
      validFrom: new Date(req.body.validFrom),
      validUntil: new Date(req.body.validUntil),
      applicableProductIds: req.body.applicableProductIds,
    })

    return res.status(201).json({ success: true, data: result })
  }

  async validate(req: Request, res: Response): Promise<Response> {
    Logger.info('Validate promo code request', { body: req.body })
    const result = await this.validatePromoCodeUseCase.execute({
      code: req.body.code,
      purchaseAmount: req.body.purchaseAmount,
      productId: req.body.productId,
    })

    return res.status(200).json({ success: true, data: result })
  }

  async list(req: Request, res: Response): Promise<Response> {
    Logger.info('List promo codes request', { query: req.query })

    const status = this.parseEnumValue<PromoCodeStatus>(
      req.query.status as string | undefined,
      PromoCodeStatus
    )
    const type = this.parseEnumValue<PromoCodeType>(
      req.query.type as string | undefined,
      PromoCodeType
    )
    const isActive =
      typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined

    const result = await this.listPromoCodesUseCase.execute({
      status,
      type,
      isActive,
    })

    return res.status(200).json({ success: true, data: result })
  }

  async disable(req: Request, res: Response): Promise<Response> {
    Logger.info('Disable promo code request', { params: req.params })

    const result = await this.disablePromoCodeUseCase.execute(req.params.id)

    return res.status(200).json({ success: true, data: result })
  }

  private parseEnumValue<T extends string>(
    value: string | undefined,
    enumObj: Record<string, T>
  ): T | undefined {
    if (!value) {
      return undefined
    }

    const match = Object.values(enumObj).find((enumValue) => enumValue === value)

    return match
  }
}
