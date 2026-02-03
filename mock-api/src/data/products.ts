export interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number
  createdAt: number
  lastModifiedAt: number
}

const now = Date.now()

export const ProductsData = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    sku: 'LAPTOP-001',
    name: 'Professional Laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    createdAt: now - 604800000, // 7 days ago
    lastModifiedAt: now - 86400000, // 1 day ago
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    sku: 'MOUSE-001',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 49.99,
    createdAt: now - 518400000, // 6 days ago
    lastModifiedAt: now - 172800000, // 2 days ago
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    sku: 'KEYBOARD-001',
    name: 'Mechanical Keyboard',
    description: 'Premium mechanical keyboard with RGB lighting',
    price: 149.99,
    createdAt: now - 432000000, // 5 days ago
    lastModifiedAt: now - 86400000, // 1 day ago
  },
]
