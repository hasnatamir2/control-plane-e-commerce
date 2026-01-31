import { v4 as uuidv4 } from 'uuid'
import { Money } from '../value-objects/money'
import { CustomerId } from '../value-objects/customer-id'

export enum CreditTransactionType {
  GRANT = 'GRANT',
  DEDUCT = 'DEDUCT',
  REFUND = 'REFUND',
}

export interface CreditTransactionProps {
  id: string
  customerId: CustomerId
  type: CreditTransactionType
  amount: Money
  balanceBefore: Money
  balanceAfter: Money
  reason: string
  relatedPurchaseId?: string
  metadata?: Record<string, unknown>
  createdBy?: string
  createdAt: Date
}

/**
 * CreditTransaction Domain Entity
 * Immutable audit trail of credit balance changes
 */
export class CreditTransaction {
  private readonly props: CreditTransactionProps

  private constructor(props: CreditTransactionProps) {
    this.props = props
  }

  static create(params: {
    customerId: CustomerId
    type: CreditTransactionType
    amount: Money
    balanceBefore: Money
    balanceAfter: Money
    reason: string
    relatedPurchaseId?: string
    metadata?: Record<string, unknown>
    createdBy?: string
  }): CreditTransaction {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Transaction reason is required')
    }

    return new CreditTransaction({
      id: uuidv4(),
      customerId: params.customerId,
      type: params.type,
      amount: params.amount,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      reason: params.reason,
      relatedPurchaseId: params.relatedPurchaseId,
      metadata: params.metadata,
      createdBy: params.createdBy,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: CreditTransactionProps): CreditTransaction {
    return new CreditTransaction(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get customerId(): CustomerId {
    return this.props.customerId
  }

  get type(): CreditTransactionType {
    return this.props.type
  }

  get amount(): Money {
    return this.props.amount
  }

  get balanceBefore(): Money {
    return this.props.balanceBefore
  }

  get balanceAfter(): Money {
    return this.props.balanceAfter
  }

  get reason(): string {
    return this.props.reason
  }

  get relatedPurchaseId(): string | undefined {
    return this.props.relatedPurchaseId
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata
  }

  get createdBy(): string | undefined {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      customerId: this.props.customerId.value,
      type: this.props.type,
      amount: this.props.amount.toJSON(),
      balanceBefore: this.props.balanceBefore.toJSON(),
      balanceAfter: this.props.balanceAfter.toJSON(),
      reason: this.props.reason,
      relatedPurchaseId: this.props.relatedPurchaseId,
      metadata: this.props.metadata,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
    }
  }
}
