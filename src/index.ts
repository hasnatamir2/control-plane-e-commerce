import 'dotenv/config'
import { createApp } from './presentation/http/app'
import { Logger } from './shared/utils/logger'
import { DatabaseClient } from './infrastructure/database/client'

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
  try {
    const app = createApp()

    const server = app.listen(PORT, () => {
      Logger.info(`🚀 Server started on port ${PORT}`)
      Logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      Logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
      Logger.info(`📚 API Base: http://localhost:${PORT}/api`)
    })

    const gracefulShutdown = async (signal: string): Promise<void> => {
      Logger.info(`${signal} received. Starting graceful shutdown...`)

      server.close(async () => {
        Logger.info('HTTP server closed')

        try {
          await DatabaseClient.disconnect()
          Logger.info('Database connection closed')
          process.exit(0)
        } catch (error) {
          Logger.error('Error during shutdown', error)
          process.exit(1)
        }
      })

      setTimeout(() => {
        Logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason) => {
      Logger.error('Unhandled Rejection', reason)
      process.exit(1)
    })
  } catch (error) {
    Logger.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()
