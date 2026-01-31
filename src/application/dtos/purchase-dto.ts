export interface PurchaseDto {
  id: string
  customerId: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  refundedAmount: number
  remainingAmount: number
  status: string
  shipmentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseDetailDto extends PurchaseDto {
  productSnapshot: ProductSnapshotDto
  customerSnapshot: CustomerSnapshotDto
  refunds: RefundDto[]
}

export interface ProductSnapshotDto {
  id: string
  sku: string
  name: string
  description: string
  price: number
}

export interface CustomerSnapshotDto {
  id: string
  name: string
  email: string
  shippingAddress: AddressDto
}

export interface AddressDto {
  line1: string
  line2?: string
  city: string
  postalCode: string
  state: string
  country: string
}

export interface CreatePurchaseDto {
  customerId: string
  productId: string
  quantity: number
  createdBy?: string
}

export interface RefundDto {
  id: string
  purchaseId: string
  amount: number
  reason?: string
  refundedBy?: string
  createdAt: Date
}

export interface RefundPurchaseDto {
  purchaseId: string
  amount: number
  reason?: string
  refundedBy?: string
}

export interface RefundResultDto {
  refundId: string
  purchaseId: string
  amount: number
  remainingAmount: number
  newStatus: string
  creditReturned: number
  timestamp: Date
}

export interface PurchaseListDto {
  purchases: PurchaseDto[]
  total: number
  limit: number
  offset: number
  totalPages: number
}
