import express, { Request, Response } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { Customer, CustomersData } from 'data/customers'
import { Product, ProductsData } from 'data/products'
import { Shipment } from 'data/shipments'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Mock data
const customers: Map<string, Customer> = new Map()
const products: Map<string, Product> = new Map()
const shipments: Map<string, Shipment> = new Map()

// Initialize with some mock data
function initializeMockData(): void {
  CustomersData.forEach((customer) => {
    customers.set(customer.id, customer)
  })

  ProductsData.forEach((product) => {
    products.set(product.id, product)
  })
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
    res.status(404).json({
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
    res.status(404).json({
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
    res.status(400).json({
      Message: 'Invalid request. shippingAddress and products are required.',
    })
  }

  // Validate all products exist
  for (const item of shipmentProducts) {
    const productExists = Array.from(products.values()).some((p) => p.sku === item.sku)
    if (!productExists) {
      res.status(400).json({
        Message: `Product with SKU ${item.sku} not found`,
      })
    }
  }

  // Simulate occasional failures (10% chance) for testing rollback logic
  if (Math.random() < 0.1) {
    res.status(500).json({
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
app.get('/api/customers', (_: Request, res: Response) => {
  const allCustomers = Array.from(customers.values())
  res.json(allCustomers)
})

// GET /api/products - List all products
app.get('/api/products', (_: Request, res: Response) => {
  const allProducts = Array.from(products.values())
  res.json(allProducts)
})

// GET /api/shipments - List all shipments (for debugging)
app.get('/api/shipments', (_: Request, res: Response) => {
  const allShipments = Array.from(shipments.values())
  res.json(allShipments)
})

// GET /api/shipments/:shipmentId - Get specific shipment
app.get('/api/shipments/:shipmentId', (req: Request, res: Response) => {
  const { shipmentId } = req.params
  const shipment = shipments.get(shipmentId as string)

  if (!shipment) {
    res.status(404).json({
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
