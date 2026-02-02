import { z } from 'zod'

export const promoCodeTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT'])
export const promoCodeStatusSchema = z.enum(['ACTIVE', 'EXPIRED', 'DISABLED', 'USED_UP'])

export const createPromoCodeBodySchema = z
  .object({
    code: z.string().min(1),
    type: promoCodeTypeSchema,
    value: z.number().positive(),
    minPurchaseAmount: z.number().positive().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    maxUsageCount: z.number().int().positive().optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    applicableProductIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  })

export const validatePromoCodeBodySchema = z.object({
  code: z.string().min(1),
  purchaseAmount: z.number().positive(),
  productId: z.string().optional(),
})

const booleanStringSchema = z
  .union([z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined
    return value === 'true'
  })

export const listPromoCodeQuerySchema = z.object({
  status: promoCodeStatusSchema.optional(),
  type: promoCodeTypeSchema.optional(),
  isActive: booleanStringSchema,
})

export const disablePromoCodeParamsSchema = z.object({
  id: z.string().uuid(),
})

// Export validation objects
export const createPromoCodeSchema = {
  body: createPromoCodeBodySchema,
}

export const validatePromoCodeSchema = {
  body: validatePromoCodeBodySchema,
}

export const listPromoCodeSchema = {
  query: listPromoCodeQuerySchema,
}

export const disablePromoCodeSchema = {
  params: disablePromoCodeParamsSchema,
}
