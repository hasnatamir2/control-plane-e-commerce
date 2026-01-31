import { Router } from 'express'
import { PurchaseController } from '../controllers/purchase-controller'
import { asyncHandler, validateRequest } from '../middlewares'
import {
  createPurchaseSchema,
  listPurchasesSchema,
  getPurchaseSchema,
  refundPurchaseSchema,
  getCustomerPurchasesSchema,
} from '../validators/purchase-schemas'

/**
 * Create purchase routes with controller instance
 */
export function createPurchaseRoutes(controller: PurchaseController): Router {
  const router = Router()

  /**
   * POST /api/purchases
   * Create a new purchase
   */
  router.post(
    '/',
    validateRequest(createPurchaseSchema),
    asyncHandler(async (req, res) => controller.createPurchase(req, res))
  )

  /**
   * GET /api/purchases
   * List all purchases with optional filtering
   */
  router.get(
    '/',
    validateRequest(listPurchasesSchema),
    asyncHandler(async (req, res) => controller.listPurchases(req, res))
  )

  /**
   * GET /api/purchases/customer/:customerId
   * Get all purchases for a specific customer
   */
  router.get(
    '/customer/:customerId',
    validateRequest(getCustomerPurchasesSchema),
    asyncHandler(async (req, res) => controller.getCustomerPurchases(req, res))
  )

  /**
   * GET /api/purchases/:purchaseId
   * Get a single purchase by ID
   */
  router.get(
    '/:purchaseId',
    validateRequest(getPurchaseSchema),
    asyncHandler(async (req, res) => controller.getPurchase(req, res))
  )

  /**
   * POST /api/purchases/:purchaseId/refund
   * Refund a purchase (full or partial)
   */
  router.post(
    '/:purchaseId/refund',
    validateRequest(refundPurchaseSchema),
    asyncHandler(async (req, res) => controller.refundPurchase(req, res))
  )

  return router
}
