import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseApi, mockApi, type Purchase } from '../lib/api'
import {
  Button,
  Select,
  Text,
  Badge,
  CardPrimary,
  Container,
  NumberField,
  TextField,
  Separator,
  useToast,
  BigStat,
  Icon,
  type BadgeState,
} from '@clickhouse/click-ui'
import { format } from 'date-fns'

export const PurchaseManagement: React.FC = () => {
  const [customerId, setCustomerId] = useState('550e8400-e29b-41d4-a716-446655440001')
  const [productId, setProductId] = useState('660e8400-e29b-41d4-a716-446655440001')
  const [quantity, setQuantity] = useState('1')
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const queryClient = useQueryClient()
  const { createToast } = useToast()

  // Fetch data
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: mockApi.getCustomers,
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: mockApi.getProducts,
  })

  const { data: purchasesList, isLoading } = useQuery({
    queryKey: ['purchases', customerId],
    queryFn: () => purchaseApi.list({ customerId, limit: 50 }),
  })

  const { data: purchaseDetail, isLoading: loadingPurchaseDetail } = useQuery({
    queryKey: ['purchase', selectedPurchase],
    queryFn: () => purchaseApi.get(selectedPurchase!),
    enabled: !!selectedPurchase,
  })

  // Create purchase mutation
  const createMutation = useMutation({
    mutationFn: ({
      customerId,
      productId,
      quantity,
    }: {
      customerId: string
      productId: string
      quantity: number
    }) => purchaseApi.create(customerId, productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      createToast({ title: 'Purchase created successfully!' })
      setQuantity('1')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create purchase'
      createToast({ type: 'danger', title: 'Failed to create purchase', description: message })
    },
  })

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: ({
      purchaseId,
      amount,
      reason,
    }: {
      purchaseId: string
      amount: number
      reason?: string
    }) => purchaseApi.refund(purchaseId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      createToast({ title: 'Refund processed successfully!' })
      setRefundAmount('')
      setRefundReason('')
    },
    onError: (error: any) => {
      createToast({
        type: 'danger',
        title: 'Failed to process refund',
        description: error.response?.data?.error?.message,
      })
    },
  })

  const handleCreatePurchase = () => {
    if (!customerId || !productId || !quantity) {
      createToast({ title: 'Please fill in all fields', type: 'danger' })
      return
    }
    createMutation.mutate({
      customerId,
      productId,
      quantity: parseInt(quantity),
    })
  }

  const handleRefund = () => {
    if (!selectedPurchase || !refundAmount) {
      createToast({ title: 'Please enter refund amount', type: 'danger' })
      return
    }
    refundMutation.mutate({
      purchaseId: selectedPurchase,
      amount: parseFloat(refundAmount),
      reason: refundReason,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'PARTIALLY_REFUNDED':
        return 'info'
      case 'FULLY_REFUNDED':
        return 'default'
      default:
        return 'default'
    }
  }

  const selectedProduct = products?.find((p: { id: string }) => p.id === productId)
  const totalAmount = selectedProduct ? selectedProduct.price * parseInt(quantity || '1') : 0

  return (
    <Container orientation="vertical" gap="lg">
      <div>
        <Text size="lg" weight="bold">
          Purchase Management
        </Text>
        <Text color="muted">Create purchases and process refunds</Text>
      </div>

      {/* Create Purchase */}
      <CardPrimary title="Create Purchase" description="Create a new purchase for a customer">
        <>
          <Container orientation="vertical" gap="md">
            <Container gap="md">
              <div>
                <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                  Customer
                </Text>
                <Select
                  value={customerId}
                  onSelect={(value) => {
                    setCustomerId(value)
                    setSelectedPurchase(null)
                  }}
                  style={{ width: '100%' }}
                  options={customers?.map(
                    (customer: { name: string; id: string; email: string }) => ({
                      label: `${customer.name} (${customer.email})`,
                      value: customer.id,
                    })
                  )}
                />
              </div>

              <div>
                <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                  Product
                </Text>
                <Select
                  value={productId}
                  onSelect={(value) => {
                    setProductId(value)
                    setSelectedPurchase(null)
                  }}
                  style={{ width: '100%' }}
                  options={products?.map(
                    (product: { name: string; price: number; id: string }) => ({
                      label: `${product.name} - $${product.price.toFixed(2)}`,
                      value: product.id,
                    })
                  )}
                />
              </div>
              <NumberField
                loading={false}
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e)}
                min="1"
              />
            </Container>

            {selectedProduct && (
              <BigStat title={`$${totalAmount.toFixed(2)}`} label="Total Amount" fillWidth />
            )}

            <Button
              onClick={handleCreatePurchase}
              loading={createMutation.isPending}
              type="primary"
              style={{ width: '100%' }}
            >
              Create Purchase
            </Button>
          </Container>
        </>
      </CardPrimary>

      {/* Purchase List */}
      <CardPrimary title="Recent Purchases">
        <>
          {isLoading ? (
            <Text>Loading purchases...</Text>
          ) : purchasesList?.purchases.length === 0 ? (
            <Text color="muted">No purchases yet</Text>
          ) : (
            <Container orientation="vertical" gap="sm">
              {purchasesList?.purchases.map((purchase: Purchase) => (
                <CardPrimary
                  key={purchase.id}
                  style={{
                    cursor: 'pointer',
                    border:
                      selectedPurchase === purchase.id
                        ? '2px solid var(--cui-color-primary)'
                        : '1px solid var(--cui-border-default)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedPurchase(purchase.id)}
                >
                  <>
                    <Container justifyContent="space-between" alignItems="start">
                      <Container orientation="vertical" gap="sm" style={{ flex: 1 }}>
                        <Container gap="sm" alignItems="center">
                          <Text size="sm" color="muted">
                            #{purchase.id.slice(0, 8)}
                          </Text>
                          <Badge
                            state={getStatusColor(purchase.status) as BadgeState}
                            text={purchase.status}
                          />
                        </Container>
                        <Text size="sm">
                          Quantity: {purchase.quantity} × ${purchase.unitPrice.toFixed(2)}
                        </Text>
                        <Text size="xs" color="muted">
                          {format(new Date(purchase.createdAt), 'PPpp')}
                        </Text>
                      </Container>
                      <Container orientation="vertical" alignItems="end">
                        <Text weight="bold">${purchase.totalAmount.toFixed(2)}</Text>
                        {purchase.refundedAmount > 0 && (
                          <Text size="sm" color="danger">
                            Refunded: ${purchase.refundedAmount.toFixed(2)}
                          </Text>
                        )}
                      </Container>
                    </Container>
                  </>
                </CardPrimary>
              ))}
            </Container>
          )}
        </>
      </CardPrimary>

      {/* Purchase Detail & Refund */}
      {selectedProduct && loadingPurchaseDetail && (
        <Text fillWidth style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Icon name="loading-animated" style={{}} /> Loading Purchase Details
        </Text>
      )}
      {selectedPurchase && purchaseDetail && (
        <CardPrimary
          title="Process Refund"
          description={`Purchase #${selectedPurchase.slice(0, 8)} - ${purchaseDetail.productSnapshot?.name}`}
        >
          <>
            <Container orientation="vertical" gap="md">
              <CardPrimary style={{ padding: '16px', backgroundColor: 'var(--cui-bg-subtle)' }}>
                <Container wrap="wrap" gap="lg">
                  <Container orientation="vertical" gap="xs">
                    <Text size="sm" color="muted">
                      Total Amount
                    </Text>
                    <Text weight="medium">${purchaseDetail.totalAmount.toFixed(2)}</Text>
                  </Container>
                  <Container orientation="vertical" gap="xs">
                    <Text size="sm" color="muted">
                      Refunded
                    </Text>
                    <Text weight="medium">${purchaseDetail.refundedAmount.toFixed(2)}</Text>
                  </Container>
                  <Container orientation="vertical" gap="xs">
                    <Text size="sm" color="muted">
                      Remaining
                    </Text>
                    <Text weight="medium" color="muted">
                      ${purchaseDetail.remainingAmount.toFixed(2)}
                    </Text>
                  </Container>
                  <Container orientation="vertical" gap="xs">
                    <Text size="sm" color="muted">
                      Status
                    </Text>
                    <Badge
                      state={getStatusColor(purchaseDetail.status) as BadgeState}
                      text={purchaseDetail.status}
                    />
                  </Container>
                </Container>
              </CardPrimary>

              {purchaseDetail.remainingAmount > 0 && (
                <>
                  <NumberField
                    loading={false}
                    type="number"
                    label="Refund Amount"
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={setRefundAmount}
                    step="0.01"
                  />
                  <TextField
                    label="Reason (optional)"
                    placeholder="Customer request, damaged item, etc."
                    value={refundReason}
                    onChange={setRefundReason}
                  />
                  <Button
                    onClick={handleRefund}
                    loading={refundMutation.isPending}
                    type="danger"
                    style={{ width: '100%' }}
                  >
                    Process Refund
                  </Button>
                </>
              )}

              {purchaseDetail.refunds && purchaseDetail.refunds.length > 0 && (
                <div>
                  <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                    Refund History
                  </Text>
                  <Container orientation="vertical" gap="sm">
                    {purchaseDetail.refunds.map(
                      (
                        refund: {
                          id: string
                          amount: number
                          reason?: string
                          createdAt: string
                        },
                        index
                      ) => (
                        <div key={refund.id}>
                          {index > 0 && <Separator orientation="horizontal" size="sm" />}
                          <Container
                            justifyContent="space-between"
                            style={{ padding: '8px 0' }}
                            gap="sm"
                          >
                            <Text weight="medium">${refund.amount.toFixed(2)} </Text>
                            <Text size="sm" color="muted">
                              {format(new Date(refund.createdAt), 'PPp')}
                            </Text>
                          </Container>
                          {refund.reason && (
                            <Text size="sm" color="muted">
                              {refund.reason}
                            </Text>
                          )}
                        </div>
                      )
                    )}
                  </Container>
                </div>
              )}
            </Container>
          </>
        </CardPrimary>
      )}
    </Container>
  )
}
