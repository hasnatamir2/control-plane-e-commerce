import { Router } from 'express'
import { asyncHandler, validateRequest } from '../middlewares'

import { PromoCodeController } from '../controllers/promo-code-controller'
import {
  createPromoCodeSchema,
  validatePromoCodeSchema,
  listPromoCodeSchema,
  disablePromoCodeSchema,
} from '../validators/promo-code-schemas'

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
   * Validate a promo code
   */
  router.post(
    '/validate',
    validateRequest(validatePromoCodeSchema),
    asyncHandler(async (req, res) => controller.validate(req, res))
  )

  /**
   * GET /api/promo-code
   * List promo codes
   */
  router.get(
    '/',
    validateRequest(listPromoCodeSchema),
    asyncHandler(async (req, res) => controller.list(req, res))
  )

  /**
   * PATCH /api/promo-code/:id/disable
   * Disable a promo code
   */
  router.patch(
    '/:id/disable',
    validateRequest(disablePromoCodeSchema),
    asyncHandler(async (req, res) => controller.disable(req, res))
  )

  return router
}
