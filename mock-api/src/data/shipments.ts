export interface Address {
  line1: string
  line2?: string
  city: string
  postalCode: string
  state: string
  country: string
}

export interface Shipment {
  id: string
  shippingAddress: Address
  products: Array<{ sku: string; quantity: number }>
  createdAt: number
}

export const ShipmentData = [
  {
    shippingAddress: {
      line1: '123 Market Street',
      line2: 'Apt 4B',
      city: 'San Francisco',
      postalCode: '94105',
      state: 'CA',
      country: 'US',
    },
    products: [
      {
        sku: 'LAPTOP-001',
        quantity: 1,
      },
      {
        sku: 'MOUSE-001',
        quantity: 2,
      },
    ],
  },
]
