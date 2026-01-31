import { DatabaseClient } from '../infrastructure/database/client'

/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test'

// Global test timeout
jest.setTimeout(10000)

// Clean up after all tests
afterAll(async () => {
  await DatabaseClient.disconnect()
})
