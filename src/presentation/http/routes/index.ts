import { Router } from 'express'
import { healthRouter } from './health-routes'
import { createCreditRoutes } from './credit-routes'
import { createPurchaseRoutes } from './purchase-routes'
import { container } from '@infrastructure/container'
import { createPromoCodeRoutes } from './promo-code-routes'

const router = Router()

// Health check
router.use(healthRouter)

// API routes
router.use('/api/credits', createCreditRoutes(container.creditController))
router.use('/api/purchases', createPurchaseRoutes(container.purchaseController))
router.use('/api/promo-code', createPromoCodeRoutes(container.promoCodeController))

export { router }
