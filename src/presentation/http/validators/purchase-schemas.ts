import { z } from 'zod'

/**
 * Validation schemas for Purchase API endpoints
 */

// Body schemas
const createPurchaseBodySchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  createdBy: z.string().optional(),
})

const refundPurchaseBodySchema = z.object({
  amount: z.number().positive('Refund amount must be greater than 0'),
  reason: z.string().optional(),
  refundedBy: z.string().optional(),
})

// Param schemas
const purchaseIdParamSchema = z.object({
  purchaseId: z.string().uuid('Purchase ID must be a valid UUID'),
})

const customerIdParamSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
})

// Query schemas
const listPurchasesQuerySchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional(),
  status: z
    .enum(['PENDING', 'COMPLETED', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED', 'CANCELLED'])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

// Export validation objects
export const createPurchaseSchema = {
  body: createPurchaseBodySchema,
}

export const listPurchasesSchema = {
  query: listPurchasesQuerySchema,
}

export const getPurchaseSchema = {
  params: purchaseIdParamSchema,
}

export const refundPurchaseSchema = {
  params: purchaseIdParamSchema,
  body: refundPurchaseBodySchema,
}

export const getCustomerPurchasesSchema = {
  params: customerIdParamSchema,
  query: paginationQuerySchema,
}
