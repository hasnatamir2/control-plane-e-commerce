import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface CreditBalance {
  customerId: string
  currentBalance: number
  lastUpdated: string
}

export interface CreditTransaction {
  id: string
  type: 'GRANT' | 'DEDUCT' | 'REFUND'
  amount: number
  balanceBefore: number
  balanceAfter: number
  reason: string
  relatedPurchaseId?: string
  createdAt: string
}

export interface Purchase {
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
  createdAt: string
  updatedAt: string
  discountAmount: number
}

export interface PurchaseDetail extends Purchase {
  productSnapshot: {
    name: string
    sku: string
    price: number
  }
  customerSnapshot: {
    name: string
    email: string
  }
  refunds: Array<{
    id: string
    amount: number
    reason?: string
    createdAt: string
  }>
}

export interface PromoCode {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  status: string
  currentUsageCount?: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  maxUsageCount?: number
  validFrom: Date
  validUntil: Date
  applicableProductIds?: string[]
}

export interface ErrorReponse extends Error {
  response: {
    data: {
      error: {
        message: string
      }
    }
  }
}

// API Functions
export const creditApi = {
  grant: async (customerId: string, amount: number, reason: string) => {
    const response = await api.post('/credits/grant', {
      customerId,
      amount,
      reason,
      createdBy: 'admin-panel',
    })
    return response.data.data
  },

  deduct: async (customerId: string, amount: number, reason: string) => {
    const response = await api.post('/credits/deduct', {
      customerId,
      amount,
      reason,
      createdBy: 'admin-panel',
    })
    return response.data.data
  },

  getBalance: async (customerId: string): Promise<CreditBalance> => {
    const response = await api.get(`/credits/balance/${customerId}`)
    return response.data.data
  },

  getTransactions: async (customerId: string): Promise<CreditTransaction[]> => {
    const response = await api.get(`/credits/transactions/${customerId}`)
    return response.data.data.transactions
  },
}

export const purchaseApi = {
  list: async (params?: {
    customerId?: string
    status?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/purchases', { params })
    return response.data.data
  },

  get: async (purchaseId: string): Promise<PurchaseDetail> => {
    const response = await api.get(`/purchases/${purchaseId}`)
    return response.data.data
  },

  create: async (customerId: string, productId: string, quantity: number, promoCode?: string) => {
    const response = await api.post('/purchases', {
      customerId,
      productId,
      quantity,
      promoCode,
      createdBy: 'admin-panel',
    })
    return response.data.data
  },

  refund: async (purchaseId: string, amount: number, reason?: string) => {
    const response = await api.post(`/purchases/${purchaseId}/refund`, {
      amount,
      reason,
      refundedBy: 'admin-panel',
    })
    return response.data.data
  },
}

export const promoCodeApi = {
  create: async (data: {
    code: string
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    minPurchaseAmount?: number
    maxDiscountAmount?: number
    maxUsageCount?: number
    validFrom: Date
    validUntil: Date
  }) => {
    const response = await api.post('/promo-code', data)
    return response.data.data
  },

  list: async () => {
    // TODO:
    const response = await api.get('/promo-code')
    return response.data.data
  },

  validate: async (code: string, purchaseAmount: number, productId?: string) => {
    const response = await api.post('/promo-code/validate', {
      code,
      purchaseAmount,
      productId,
    })
    return response.data.data
  },

  disable: async (id: string) => {
    // TODO:
    const response = await api.patch(`/promo-code/${id}/disable`)
    return response.data.data
  },
}

// Mock API for test data
export const mockApi = {
  getCustomers: async () => {
    const response = await axios.get('http://localhost:3001/api/customers')
    return response.data
  },

  getProducts: async () => {
    const response = await axios.get('http://localhost:3001/api/products')
    return response.data
  },
}
