import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { router } from './routes'
import { errorHandler } from './middlewares'

export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'E-Commerce Platform API',
      version: '1.0.0',
      status: 'running',
    })
  })

  app.use(router)

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
      },
    })
  })

  app.use(errorHandler)

  return app
}
