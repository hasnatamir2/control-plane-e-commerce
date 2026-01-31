import { v4 as uuidv4 } from 'uuid'
import { Money } from '../value-objects/money'

export interface RefundProps {
  id: string
  purchaseId: string
  amount: Money
  reason?: string
  refundedBy?: string
  createdAt: Date
}

/**
 * Refund Domain Entity
 * Represents a refund operation on a purchase
 */
export class Refund {
  private readonly props: RefundProps

  private constructor(props: RefundProps) {
    this.props = props
  }

  static create(params: {
    purchaseId: string
    amount: Money
    reason?: string
    refundedBy?: string
  }): Refund {
    if (params.amount.isZero() || params.amount.value <= 0) {
      throw new Error('Refund amount must be greater than zero')
    }

    return new Refund({
      id: uuidv4(),
      purchaseId: params.purchaseId,
      amount: params.amount,
      reason: params.reason,
      refundedBy: params.refundedBy,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: RefundProps): Refund {
    return new Refund(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get purchaseId(): string {
    return this.props.purchaseId
  }

  get amount(): Money {
    return this.props.amount
  }

  get reason(): string | undefined {
    return this.props.reason
  }

  get refundedBy(): string | undefined {
    return this.props.refundedBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      purchaseId: this.props.purchaseId,
      amount: this.props.amount.toJSON(),
      reason: this.props.reason,
      refundedBy: this.props.refundedBy,
      createdAt: this.props.createdAt.toISOString(),
    }
  }
}
