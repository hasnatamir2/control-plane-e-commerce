import { Router } from 'express'
import { asyncHandler, validateRequest } from '../middlewares'

import { PromoCodeController } from '../controllers/promo-code-controller'
import { createPromoCodeSchema, validatePromoCodeSchema } from '../validators/promo-code-schemas'

export function createPromoCodeRoutes(controller: PromoCodeController): Router {
  const router = Router()

  /**
   * POST /api/promo-code
   * Create a new promo code
   */
  router.post(
    '/',
    validateRequest(createPromoCodeSchema),
    asyncHandler(async (req, res) => controller.create(req, res))
  )

  /**
   * POST /api/promo-code/validate
   * Create a new promo code
   */
  router.post(
    '/validate',
    validateRequest(validatePromoCodeSchema),
    asyncHandler(async (req, res) => controller.validate(req, res))
  )

  /**
   * GET /api/promo-code
   * Create a new promo code
   */
  router.get(
    '/',
    validateRequest(validatePromoCodeSchema),
    asyncHandler(async (req, res) => controller.validate(req, res))
  )

  return router
}
