// External API Types based on OpenAPI specification

export interface Address {
  line1: string
  line2?: string
  city: string
  postalCode: string
  state: string
  country: string
}

export interface Customer {
  id: string
  name: string
  billingAddress: Address
  shippingAddress: Address
  email: string
  createdAt: number // Unix epoch millis
  lastModifiedAt: number // Unix epoch millis
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number // USD
  createdAt: number // Unix epoch millis
  lastModifiedAt: number // Unix epoch millis
}

export interface ShipmentProduct {
  sku: string
  quantity: number
}

export interface CreateShipmentRequest {
  shippingAddress: Address
  products: ShipmentProduct[]
}

export interface CreateShipmentResponse {
  id: string
}

export interface ApiError {
  Message: string
}
