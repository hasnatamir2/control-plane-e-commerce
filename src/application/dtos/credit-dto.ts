export interface CreditBalanceDto {
  customerId: string
  currentBalance: number
  lastUpdated: Date
}

export interface CreditTransactionDto {
  id: string
  customerId: string
  type: 'GRANT' | 'DEDUCT' | 'REFUND'
  amount: number
  balanceBefore: number
  balanceAfter: number
  reason: string
  relatedPurchaseId?: string
  metadata?: Record<string, unknown>
  createdBy?: string
  createdAt: Date
}

export interface GrantCreditDto {
  customerId: string
  amount: number
  reason: string
  createdBy?: string
  metadata?: Record<string, unknown>
}

export interface DeductCreditDto {
  customerId: string
  amount: number
  reason: string
  createdBy?: string
  metadata?: Record<string, unknown>
}

export interface CreditOperationResultDto {
  customerId: string
  previousBalance: number
  newBalance: number
  transactionId: string
  timestamp: Date
}
