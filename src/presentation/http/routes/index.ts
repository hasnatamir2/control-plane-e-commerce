import { Router } from 'express'
import { healthRouter } from './health-routes'
import { createCreditRoutes } from './credit-routes'
import { createPurchaseRoutes } from './purchase-routes'
import { container } from '@infrastructure/container'

const router = Router()

// Health check
router.use(healthRouter)

// API routes
router.use('/api/credits', createCreditRoutes(container.creditController))
router.use('/api/purchases', createPurchaseRoutes(container.purchaseController))

export { router }
