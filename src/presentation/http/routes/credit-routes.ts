import { Router } from 'express'
import { CreditController } from '../controllers/credit-controller'
import { asyncHandler, validateRequest } from '../middlewares'
import {
  grantCreditSchema,
  deductCreditSchema,
  getBalanceSchema,
  getTransactionHistorySchema,
} from '../validators/credit-schemas'

/**
 * Create credit routes with controller instance
 */
export function createCreditRoutes(controller: CreditController): Router {
  const router = Router()

  /**
   * POST /api/credits/grant
   * Grant credit to a customer
   */
  router.post(
    '/grant',
    validateRequest(grantCreditSchema),
    asyncHandler(async (req, res) => controller.grantCredit(req, res))
  )

  /**
   * POST /api/credits/deduct
   * Deduct credit from a customer
   */
  router.post(
    '/deduct',
    validateRequest(deductCreditSchema),
    asyncHandler(async (req, res) => controller.deductCredit(req, res))
  )

  /**
   * GET /api/credits/balance/:customerId
   * Get customer's credit balance
   */
  router.get(
    '/balance/:customerId',
    validateRequest(getBalanceSchema),
    asyncHandler(async (req, res) => controller.getBalance(req, res))
  )

  /**
   * GET /api/credits/transactions/:customerId
   * Get customer's credit transaction history
   */
  router.get(
    '/transactions/:customerId',
    validateRequest(getTransactionHistorySchema),
    asyncHandler(async (req, res) => controller.getTransactionHistory(req, res))
  )

  return router
}
