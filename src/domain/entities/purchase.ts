import { v4 as uuidv4 } from 'uuid'
import { Money } from '../value-objects/money'
import { CustomerId } from '../value-objects/customer-id'
import { ProductId } from '../value-objects/product-id'
import { Customer, Product } from '../../shared/types/external-api.types'

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  FULLY_REFUNDED = 'FULLY_REFUNDED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseProps {
  id: string
  customerId: CustomerId
  productId: ProductId
  quantity: number
  unitPrice: Money
  totalAmount: Money
  refundedAmount: Money
  status: PurchaseStatus
  shipmentId?: string
  productSnapshot?: Product
  customerSnapshot?: Customer
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Purchase Domain Entity
 * Represents a product purchase with all associated business logic
 */
export class Purchase {
  private readonly props: PurchaseProps

  private constructor(props: PurchaseProps) {
    this.props = props
  }

  static create(params: {
    customerId: CustomerId
    productId: ProductId
    quantity: number
    unitPrice: Money
    productSnapshot?: Product
    customerSnapshot?: Customer
    createdBy?: string
  }): Purchase {
    if (params.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    const totalAmount = params.unitPrice.multiply(params.quantity)

    return new Purchase({
      id: uuidv4(),
      customerId: params.customerId,
      productId: params.productId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      totalAmount,
      refundedAmount: Money.zero(),
      status: PurchaseStatus.PENDING,
      productSnapshot: params.productSnapshot,
      customerSnapshot: params.customerSnapshot,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: PurchaseProps): Purchase {
    return new Purchase(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get customerId(): CustomerId {
    return this.props.customerId
  }

  get productId(): ProductId {
    return this.props.productId
  }

  get quantity(): number {
    return this.props.quantity
  }

  get unitPrice(): Money {
    return this.props.unitPrice
  }

  get totalAmount(): Money {
    return this.props.totalAmount
  }

  get refundedAmount(): Money {
    return this.props.refundedAmount
  }

  get status(): PurchaseStatus {
    return this.props.status
  }

  get shipmentId(): string | undefined {
    return this.props.shipmentId
  }

  get productSnapshot(): Product | undefined {
    return this.props.productSnapshot
  }

  get customerSnapshot(): Customer | undefined {
    return this.props.customerSnapshot
  }

  get createdBy(): string | undefined {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business methods

  complete(shipmentId: string): void {
    if (this.props.status !== PurchaseStatus.PENDING) {
      throw new Error('Only pending purchases can be completed')
    }

    this.props.shipmentId = shipmentId
    this.props.status = PurchaseStatus.COMPLETED
    this.props.updatedAt = new Date()
  }

  cancel(): void {
    if (this.props.status !== PurchaseStatus.PENDING) {
      throw new Error('Only pending purchases can be cancelled')
    }

    this.props.status = PurchaseStatus.CANCELLED
    this.props.updatedAt = new Date()
  }

  refund(amount: Money): void {
    if (
      this.props.status !== PurchaseStatus.COMPLETED &&
      this.props.status !== PurchaseStatus.PARTIALLY_REFUNDED
    ) {
      throw new Error('Can only refund completed or partially refunded purchases')
    }

    const remainingAmount = this.props.totalAmount.subtract(this.props.refundedAmount)

    if (amount.isGreaterThan(remainingAmount)) {
      throw new Error('Refund amount cannot exceed remaining purchase amount')
    }

    this.props.refundedAmount = this.props.refundedAmount.add(amount)

    // Update status based on refunded amount
    if (this.props.refundedAmount.equals(this.props.totalAmount)) {
      this.props.status = PurchaseStatus.FULLY_REFUNDED
    } else {
      this.props.status = PurchaseStatus.PARTIALLY_REFUNDED
    }

    this.props.updatedAt = new Date()
  }

  getRemainingAmount(): Money {
    return this.props.totalAmount.subtract(this.props.refundedAmount)
  }

  isRefundable(): boolean {
    return (
      (this.props.status === PurchaseStatus.COMPLETED ||
        this.props.status === PurchaseStatus.PARTIALLY_REFUNDED) &&
      !this.props.refundedAmount.equals(this.props.totalAmount)
    )
  }

  isFullyRefunded(): boolean {
    return this.props.status === PurchaseStatus.FULLY_REFUNDED
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      customerId: this.props.customerId.value,
      productId: this.props.productId.value,
      quantity: this.props.quantity,
      unitPrice: this.props.unitPrice.toJSON(),
      totalAmount: this.props.totalAmount.toJSON(),
      refundedAmount: this.props.refundedAmount.toJSON(),
      status: this.props.status,
      shipmentId: this.props.shipmentId,
      productSnapshot: this.props.productSnapshot,
      customerSnapshot: this.props.customerSnapshot,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    }
  }
}
