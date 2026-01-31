import { AppError } from "./app-error";

/**
 * Thrown when shipment creation fails
 * This should trigger a transaction rollback
 */
export class ShipmentFailedError extends AppError {
  constructor(reason: string) {
    super(`Shipment creation failed: ${reason}`, 500);
    this.name = 'ShipmentFailedError';
    Object.setPrototypeOf(this, ShipmentFailedError.prototype);
  }
}
