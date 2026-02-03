import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '@shared/errors'

interface ValidationSchema {
  body?: ZodSchema
  params?: ZodSchema
  query?: ZodSchema
}

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown
        params?: unknown
        query?: unknown
      }
    }
  }
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.validated = {}

      if (schema.body) {
        req.validated.body = schema.body.parse(req.body)
      }

      if (schema.params) {
        req.validated.params = schema.params.parse(req.params)
      }

      if (schema.query) {
        req.validated.query = schema.query.parse(req.query)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            'Request validation failed',
            error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
          )
        )
      } else {
        next(error)
      }
    }
  }
}
