import { Address } from './shipments'

export interface Customer {
  id: string
  name: string
  billingAddress: Address
  shippingAddress: Address
  email: string
  createdAt: number
  lastModifiedAt: number
}

const now = Date.now()

export const CustomersData = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    billingAddress: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'New York',
      postalCode: '10001',
      state: 'NY',
      country: 'USA',
    },
    shippingAddress: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'New York',
      postalCode: '10001',
      state: 'NY',
      country: 'USA',
    },
    createdAt: now - 86400000, // 1 day ago
    lastModifiedAt: now - 3600000, // 1 hour ago
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    billingAddress: {
      line1: '456 Oak Ave',
      city: 'San Francisco',
      postalCode: '94102',
      state: 'CA',
      country: 'USA',
    },
    shippingAddress: {
      line1: '789 Pine St',
      city: 'San Francisco',
      postalCode: '94103',
      state: 'CA',
      country: 'USA',
    },
    createdAt: now - 172800000, // 2 days ago
    lastModifiedAt: now - 7200000, // 2 hours ago
  },
]
