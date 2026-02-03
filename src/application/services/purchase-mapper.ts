import { Purchase } from '@domain/entities/purchase'
import { Refund } from '@domain/entities/refund'
import { Address, Customer, Product } from '@shared/types/external-api.types'
import {
  PurchaseDto,
  PurchaseDetailDto,
  RefundDto,
  ProductSnapshotDto,
  CustomerSnapshotDto,
  AddressDto,
  RefundResultDto,
  PurchaseListDto,
} from '../dtos/purchase-dto'

/**
 * Purchase Mapper Application Service
 *
 * Converts between domain entities and DTOs
 * Ensures presentation layer receives only necessary data
 */
export class PurchaseMapper {
  /**
   * Convert Purchase entity to simple DTO (for lists)
   */
  static toPurchaseDto(purchase: Purchase): PurchaseDto {
    return {
      id: purchase.id,
      customerId: purchase.customerId.value,
      productId: purchase.productId.value,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice.value,
      totalAmount: purchase.totalAmount.value,
      refundedAmount: purchase.refundedAmount.value,
      remainingAmount: purchase.getRemainingAmount().value,
      status: purchase.status,
      shipmentId: purchase.shipmentId,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }
  }

  /**
   * Convert Purchase entity to detailed DTO (includes snapshots and refunds)
   */
  static toPurchaseDetailDto(purchase: Purchase, refunds: Refund[]): PurchaseDetailDto {
    return {
      ...this.toPurchaseDto(purchase),
      productSnapshot: purchase.productSnapshot
        ? this.toProductSnapshotDto(purchase.productSnapshot)
        : ({} as ProductSnapshotDto),
      customerSnapshot: purchase.customerSnapshot
        ? this.toCustomerSnapshotDto(purchase.customerSnapshot)
        : ({} as CustomerSnapshotDto),
      refunds: refunds.map((r) => this.toRefundDto(r)),
    }
  }

  /**
   * Convert Product to ProductSnapshotDto
   */
  static toProductSnapshotDto(product: Product): ProductSnapshotDto {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
    }
  }

  /**
   * Convert Customer to CustomerSnapshotDto
   */
  static toCustomerSnapshotDto(customer: Customer): CustomerSnapshotDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      shippingAddress: this.toAddressDto(customer.shippingAddress),
    }
  }

  /**
   * Convert Address to AddressDto
   */
  static toAddressDto(address: Address): AddressDto {
    return {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postalCode: address.postalCode,
      state: address.state,
      country: address.country,
    }
  }

  /**
   * Convert Refund entity to DTO
   */
  static toRefundDto(refund: Refund): RefundDto {
    return {
      id: refund.id,
      purchaseId: refund.purchaseId,
      amount: refund.amount.value,
      reason: refund.reason,
      refundedBy: refund.refundedBy,
      createdAt: refund.createdAt,
    }
  }

  /**
   * Convert refund operation result to DTO
   */
  static toRefundResultDto(purchase: Purchase, refund: Refund): RefundResultDto {
    return {
      refundId: refund.id,
      purchaseId: purchase.id,
      amount: refund.amount.value,
      remainingAmount: purchase.getRemainingAmount().value,
      newStatus: purchase.status,
      creditReturned: refund.amount.value,
      timestamp: refund.createdAt,
    }
  }

  /**
   * Convert multiple purchases to DTOs
   */
  static toPurchaseDtos(purchases: Purchase[]): PurchaseDto[] {
    return purchases.map((p) => this.toPurchaseDto(p))
  }

  /**
   * Create paginated purchase list DTO
   */
  static toPurchaseListDto(
    purchases: Purchase[],
    total: number,
    limit: number,
    offset: number
  ): PurchaseListDto {
    return {
      purchases: this.toPurchaseDtos(purchases),
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    }
  }
}
