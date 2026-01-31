import { validate as uuidValidate } from 'uuid'

/**
 * ProductId Value Object
 * Ensures product IDs are valid UUIDs
 */
export class ProductId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  static from(value: string): ProductId {
    if (!value || value.trim().length === 0) {
      throw new Error('Product ID cannot be empty')
    }

    if (!uuidValidate(value)) {
      throw new Error('Product ID must be a valid UUID')
    }

    return new ProductId(value)
  }

  get value(): string {
    return this._value
  }

  equals(other: ProductId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  toJSON(): string {
    return this._value
  }
}
