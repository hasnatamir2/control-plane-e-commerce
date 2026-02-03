import { z } from 'zod'

/**
 * Validation schemas for Credit API endpoints
 */

// Body schemas
const grantCreditBodySchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  amount: z.number().positive('Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  createdBy: z.string().optional(),
  metadata: z.object(z.unknown()).optional(),
})

const deductCreditBodySchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
  amount: z.number().positive('Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  createdBy: z.string().optional(),
  metadata: z.object(z.unknown()).optional(),
})

const customerIdParamSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID'),
})

const transactionHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

// Export validation objects
export const grantCreditSchema = {
  body: grantCreditBodySchema,
}

export const deductCreditSchema = {
  body: deductCreditBodySchema,
}

export const getBalanceSchema = {
  params: customerIdParamSchema,
}

export const getTransactionHistorySchema = {
  params: customerIdParamSchema,
  query: transactionHistoryQuerySchema,
}
