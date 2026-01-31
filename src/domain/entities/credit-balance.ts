import { Money } from '../value-objects/money'
import { CustomerId } from '../value-objects/customer-id'

export interface CreditBalanceProps {
  id: string
  customerId: CustomerId
  currentBalance: Money
  version: number
  createdAt: Date
  updatedAt: Date
}

/**
 * CreditBalance Domain Entity
 * Manages customer credit balance with optimistic locking
 */
export class CreditBalance {
  private readonly props: CreditBalanceProps

  private constructor(props: CreditBalanceProps) {
    this.props = props
  }

  static create(params: {
    id: string
    customerId: CustomerId
    initialBalance?: Money
  }): CreditBalance {
    return new CreditBalance({
      id: params.id,
      customerId: params.customerId,
      currentBalance: params.initialBalance || Money.zero(),
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: CreditBalanceProps): CreditBalance {
    return new CreditBalance(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get customerId(): CustomerId {
    return this.props.customerId
  }

  get currentBalance(): Money {
    return this.props.currentBalance
  }

  get version(): number {
    return this.props.version
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business methods

  credit(amount: Money): void {
    this.props.currentBalance = this.props.currentBalance.add(amount)
    this.incrementVersion()
    this.props.updatedAt = new Date()
  }

  debit(amount: Money): void {
    if (this.props.currentBalance.isLessThan(amount)) {
      throw new Error('Insufficient credit balance')
    }

    this.props.currentBalance = this.props.currentBalance.subtract(amount)
    this.incrementVersion()
    this.props.updatedAt = new Date()
  }

  hasSufficientBalance(amount: Money): boolean {
    return this.props.currentBalance.isGreaterThanOrEqual(amount)
  }

  private incrementVersion(): void {
    this.props.version += 1
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      customerId: this.props.customerId.value,
      currentBalance: this.props.currentBalance.toJSON(),
      version: this.props.version,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    }
  }
}
