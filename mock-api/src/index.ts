import express, { Request, Response } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// In-memory data stores
interface Address {
  line1: string
  line2?: string
  city: string
  postalCode: string
  state: string
  country: string
}

interface Customer {
  id: string
  name: string
  billingAddress: Address
  shippingAddress: Address
  email: string
  createdAt: number
  lastModifiedAt: number
}

interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number
  createdAt: number
  lastModifiedAt: number
}

interface Shipment {
  id: string
  shippingAddress: Address
  products: Array<{ sku: string; quantity: number }>
  createdAt: number
}

// Mock data
const customers: Map<string, Customer> = new Map()
const products: Map<string, Product> = new Map()
const shipments: Map<string, Shipment> = new Map()

// Initialize with some mock data
function initializeMockData(): void {
  const now = Date.now()

  // Create mock customers
  const customer1: Customer = {
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
  }

  const customer2: Customer = {
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
  }

  customers.set(customer1.id, customer1)
  customers.set(customer2.id, customer2)

  // Create mock products
  const product1: Product = {
    id: '660e8400-e29b-41d4-a716-446655440001',
    sku: 'LAPTOP-001',
    name: 'Professional Laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    createdAt: now - 604800000, // 7 days ago
    lastModifiedAt: now - 86400000, // 1 day ago
  }

  const product2: Product = {
    id: '660e8400-e29b-41d4-a716-446655440002',
    sku: 'MOUSE-001',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 49.99,
    createdAt: now - 518400000, // 6 days ago
    lastModifiedAt: now - 172800000, // 2 days ago
  }

  const product3: Product = {
    id: '660e8400-e29b-41d4-a716-446655440003',
    sku: 'KEYBOARD-001',
    name: 'Mechanical Keyboard',
    description: 'Premium mechanical keyboard with RGB lighting',
    price: 149.99,
    createdAt: now - 432000000, // 5 days ago
    lastModifiedAt: now - 86400000, // 1 day ago
  }

  products.set(product1.id, product1)
  products.set(product2.id, product2)
  products.set(product3.id, product3)
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// GET /customers/:customerId
app.get('/api/customers/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params

  const customer = customers.get(customerId as string)

  if (!customer) {
    return res.status(404).json({
      Message: `Customer with ID ${customerId} not found`,
    })
  }

  res.json(customer)
})

// GET /products/:productId
app.get('/api/products/:productId', (req: Request, res: Response) => {
  const { productId } = req.params

  const product = products.get(productId as string)

  if (!product) {
    return res.status(404).json({
      Message: `Product with ID ${productId} not found`,
    })
  }

  res.json(product)
})

// POST /shipments
app.post('/api/shipments', (req: Request, res: Response) => {
  const { shippingAddress, products: shipmentProducts } = req.body

  // Validate request
  if (!shippingAddress || !shipmentProducts || !Array.isArray(shipmentProducts)) {
    return res.status(400).json({
      Message: 'Invalid request. shippingAddress and products are required.',
    })
  }

  // Validate all products exist
  for (const item of shipmentProducts) {
    const productExists = Array.from(products.values()).some((p) => p.sku === item.sku)
    if (!productExists) {
      return res.status(400).json({
        Message: `Product with SKU ${item.sku} not found`,
      })
    }
  }

  // Simulate occasional failures (10% chance) for testing rollback logic
  if (Math.random() < 0.1) {
    return res.status(500).json({
      Message: 'Shipment service temporarily unavailable',
    })
  }

  // Create shipment
  const shipment: Shipment = {
    id: uuidv4(),
    shippingAddress,
    products: shipmentProducts,
    createdAt: Date.now(),
  }

  shipments.set(shipment.id, shipment)

  res.status(200).json({ id: shipment.id })
})

// Additional helper endpoints (not in spec, but useful for testing)

// GET /api/customers - List all customers
app.get('/api/customers', (req: Request, res: Response) => {
  const allCustomers = Array.from(customers.values())
  res.json(allCustomers)
})

// GET /api/products - List all products
app.get('/api/products', (req: Request, res: Response) => {
  const allProducts = Array.from(products.values())
  res.json(allProducts)
})

// GET /api/shipments - List all shipments (for debugging)
app.get('/api/shipments', (req: Request, res: Response) => {
  const allShipments = Array.from(shipments.values())
  res.json(allShipments)
})

// GET /api/shipments/:shipmentId - Get specific shipment
app.get('/api/shipments/:shipmentId', (req: Request, res: Response) => {
  const { shipmentId } = req.params
  const shipment = shipments.get(shipmentId as string)

  if (!shipment) {
    return res.status(404).json({
      Message: `Shipment with ID ${shipmentId} not found`,
    })
  }

  res.json(shipment)
})

// POST /api/customers - Create customer (for testing)
app.post('/api/customers', (req: Request, res: Response) => {
  const customer: Customer = {
    id: uuidv4(),
    ...req.body,
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
  }

  customers.set(customer.id, customer)
  res.status(201).json(customer)
})

// POST /api/products - Create product (for testing)
app.post('/api/products', (req: Request, res: Response) => {
  const product: Product = {
    id: uuidv4(),
    ...req.body,
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
  }

  products.set(product.id, product)
  res.status(201).json(product)
})

// Initialize mock data
initializeMockData()

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`\nAvailable endpoints:`)
  console.log(`  GET  /api/customers`)
  console.log(`  GET  /api/customers/:customerId`)
  console.log(`  GET  /api/products`)
  console.log(`  GET  /api/products/:productId`)
  console.log(`  POST /api/shipments`)
  console.log(`  GET  /api/shipments`)
  console.log(`\nMock data initialized:`)
  console.log(`  - ${customers.size} customers`)
  console.log(`  - ${products.size} products`)
})

export default app
