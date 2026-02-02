import { Request, Response } from 'express'
import { CreatePromoCodeUseCase } from '@application/use-cases/promo-code/create-promo-code-use-case'
import { ValidatePromoCodeUseCase } from '@application/use-cases/promo-code/validate-promo-code-use-case'

export class PromoCodeController {
  constructor(
    private readonly createPromoCodeUseCase: CreatePromoCodeUseCase,
    private readonly validatePromoCodeUseCase: ValidatePromoCodeUseCase
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
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
    const result = await this.validatePromoCodeUseCase.execute({
      code: req.body.code,
      purchaseAmount: req.body.purchaseAmount,
      productId: req.body.productId,
    })

    return res.status(200).json({ success: true, data: result })
  }
}
