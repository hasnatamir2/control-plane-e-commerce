import { Decimal } from '@prisma/client/runtime/library'

/**
 * Money Value Object
 * Encapsulates monetary values with proper validation and operations
 */
export class Money {
  private readonly _amount: Decimal

  private constructor(amount: Decimal) {
    this._amount = amount
  }

  static from(amount: number | string | Decimal): Money {
    const decimal = new Decimal(amount)

    if (decimal.isNegative()) {
      throw new Error('Money amount cannot be negative')
    }

    // Ensure 2 decimal places (cents precision)
    const rounded = decimal.toDecimalPlaces(2)

    return new Money(rounded)
  }

  static zero(): Money {
    return new Money(new Decimal(0))
  }

  get amount(): Decimal {
    return this._amount
  }

  get value(): number {
    return this._amount.toNumber()
  }

  add(other: Money): Money {
    return new Money(this._amount.plus(other._amount))
  }

  subtract(other: Money): Money {
    const result = this._amount.minus(other._amount)

    if (result.isNegative()) {
      throw new Error('Cannot subtract: result would be negative')
    }

    return new Money(result)
  }

  multiply(multiplier: number): Money {
    const result = this._amount.times(multiplier)
    return new Money(result.toDecimalPlaces(2))
  }

  isGreaterThan(other: Money): boolean {
    return this._amount.greaterThan(other._amount)
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this._amount.greaterThanOrEqualTo(other._amount)
  }

  isLessThan(other: Money): boolean {
    return this._amount.lessThan(other._amount)
  }

  isLessThanOrEqual(other: Money): boolean {
    return this._amount.lessThanOrEqualTo(other._amount)
  }

  equals(other: Money): boolean {
    return this._amount.equals(other._amount)
  }

  isZero(): boolean {
    return this._amount.isZero()
  }

  toString(): string {
    return `$${this._amount.toFixed(2)}`
  }

  toJSON(): string {
    return this._amount.toString()
  }
}
