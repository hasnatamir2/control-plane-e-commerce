import { AppError } from './app-error'

/**
 * Thrown when optimistic locking fails
 * Indicates that the resource was modified by another transaction
 */
export class ConcurrencyError extends AppError {
  constructor(resource: string, identifier: string) {
    super(
      `Concurrent modification detected for ${resource} ${identifier}. Please retry the operation.`,
      409
    )
    this.name = 'ConcurrencyError'
    Object.setPrototypeOf(this, ConcurrencyError.prototype)
  }
}
