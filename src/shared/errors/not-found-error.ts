import { AppError } from './app-error'

/**
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier ${identifier} not found`, 404)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}
