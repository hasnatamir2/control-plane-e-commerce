import { AppError } from './app-error'

/**
 * Thrown when a customer doesn't have enough credit for a purchase
 */
export class InsufficientCreditError extends AppError {
  constructor(customerId: string, required: number | string, available: number | string) {
    super(
      `Insufficient credit balance. Customer ${customerId} has ${available} but needs ${required}`,
      400
    )
    this.name = 'InsufficientCreditError'
    Object.setPrototypeOf(this, InsufficientCreditError.prototype)
  }
}
