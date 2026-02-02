import { z } from 'zod'

export const promoCodeTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT'])

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

// Export validation objects
export const createPromoCodeSchema = {
  body: createPromoCodeBodySchema,
}

export const validatePromoCodeSchema = {
  body: validatePromoCodeBodySchema,
}
