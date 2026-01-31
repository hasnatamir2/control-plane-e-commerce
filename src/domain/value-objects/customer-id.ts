import { validate as uuidValidate } from 'uuid'

/**
 * CustomerId Value Object
 * Ensures customer IDs are valid UUIDs
 */
export class CustomerId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  static from(value: string): CustomerId {
    if (!value || value.trim().length === 0) {
      throw new Error('Customer ID cannot be empty')
    }

    if (!uuidValidate(value)) {
      throw new Error('Customer ID must be a valid UUID')
    }

    return new CustomerId(value)
  }

  get value(): string {
    return this._value
  }

  equals(other: CustomerId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  toJSON(): string {
    return this._value
  }
}
