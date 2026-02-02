import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseApi, mockApi, promoCodeApi, type Purchase, type ErrorReponse } from '../lib/api'
import {
  CardPrimary,
  Button,
  TextField,
  NumberField,
  Select,
  Text,
  Container,
  useToast,
  Badge,
  Separator,
  type BadgeState,
} from '@clickhouse/click-ui'
import { format } from 'date-fns'

export const PurchaseManagement: React.FC = () => {
  const { createToast } = useToast()
  const [customerId, setCustomerId] = useState('550e8400-e29b-41d4-a716-446655440001')
  const [productId, setProductId] = useState('660e8400-e29b-41d4-a716-446655440001')
  const [quantity, setQuantity] = useState('1')
  const [promoCode, setPromoCode] = useState('')
  const [promoValidation, setPromoValidation] = useState<null | {
    valid: boolean
    message?: string
    discountAmount?: number
  }>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const queryClient = useQueryClient()

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

  const { data: purchaseDetail } = useQuery({
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
      promoCode,
    }: {
      customerId: string
      productId: string
      quantity: number
      promoCode?: string
    }) => purchaseApi.create(customerId, productId, quantity, promoCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      createToast({ title: 'Purchase created successfully!', type: 'success' })
      setQuantity('1')
      setPromoCode('')
      setPromoValidation(null)
    },
    onError: (error: ErrorReponse) => {
      const message = error.response?.data?.error?.message || 'Failed to create purchase'
      createToast({ title: 'Failed to create purchase', description: message, type: 'danger' })
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
      createToast({ title: 'Refund processed successfully!', type: 'success' })
      setRefundAmount('')
      setRefundReason('')
    },
    onError: (error: ErrorReponse) => {
      createToast({
        title: 'Failed to process refund',
        description: error.response?.data?.error?.message,
        type: 'danger',
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
      promoCode: promoCode || undefined,
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

  // Validate promo code
  const handleValidatePromo = async () => {
    if (!promoCode) {
      setPromoValidation(null)
      return
    }

    const selectedProduct = products?.find((product: { id: string }) => product.id === productId)
    if (!selectedProduct) return

    const purchaseAmount = selectedProduct.price * parseInt(quantity || '1')

    try {
      const validation = await promoCodeApi.validate(promoCode, purchaseAmount, productId)
      setPromoValidation(validation)

      if (validation.valid) {
        createToast({
          title: 'Valid promo code!',
          description: `Discount: $${validation.discountAmount?.toFixed(2)}`,
          type: 'success',
        })
      } else {
        createToast({
          title: 'Invalid promo code',
          description: validation.message,
          type: 'warning',
        })
      }
    } catch (error: unknown) {
      console.log(error)
      setPromoValidation({ valid: false, message: 'Failed to validate promo code' })
      createToast({ title: 'Failed to validate promo code', type: 'danger' })
    }
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

  const selectedProduct = products?.find((product: { id: string }) => product.id === productId)
  const totalAmount = selectedProduct ? selectedProduct.price * parseInt(quantity || '1') : 0
  const discountAmount = promoValidation?.valid ? promoValidation.discountAmount || 0 : 0
  const finalAmount = totalAmount - discountAmount

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
            <Select
              label="Customer"
              value={customerId}
              onSelect={(value) => setCustomerId(value as string)}
              style={{ width: '100%' }}
              options={customers?.map((customer: { name: string; email: string; id: string }) => ({
                label: `${customer.name} (${customer.email})`,
                value: customer.id,
              }))}
            />

            <Select
              label="Product"
              value={productId}
              onSelect={(value) => {
                setProductId(value as string)
                setPromoValidation(null) // Reset promo validation on product change
              }}
              style={{ width: '100%' }}
              options={products?.map((product: { price: number; id: string; name: string }) => ({
                label: `${product.name} - $${product.price.toFixed(2)}`,
                value: product.id,
              }))}
            />

            <NumberField
              id="quantity"
              loading={false}
              label="Quantity"
              value={quantity}
              onChange={(e) => {
                setQuantity(e)
                setPromoValidation(null) // Reset promo validation on quantity change
              }}
            />

            <Separator orientation="horizontal" size="sm" />

            {/* Promo Code Section */}
            <Container orientation="vertical" gap="sm">
              <Text size="sm" weight="bold">
                Promo Code (Optional)
              </Text>
              <Container gap="sm">
                <TextField
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.toUpperCase())
                    setPromoValidation(null)
                  }}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleValidatePromo} type="secondary">
                  Validate
                </Button>
              </Container>

              {promoValidation && (
                <Container
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    backgroundColor: promoValidation.valid
                      ? 'var(--cui-bg-success-subtle)'
                      : 'var(--cui-bg-danger-subtle)',
                  }}
                >
                  {promoValidation.valid ? (
                    <Container orientation="vertical" gap="xs">
                      <Text size="sm" weight="bold" style={{ color: 'var(--cui-color-success)' }}>
                        ✓ Valid Promo Code
                      </Text>
                      <Text size="sm">Discount: ${promoValidation.discountAmount?.toFixed(2)}</Text>
                    </Container>
                  ) : (
                    <Text size="sm" style={{ color: 'var(--cui-color-danger)' }}>
                      ✗ {promoValidation.message}
                    </Text>
                  )}
                </Container>
              )}
            </Container>

            <Separator orientation="horizontal" size="sm" />

            {/* Price Summary */}
            {selectedProduct && (
              <Container
                orientation="vertical"
                gap="sm"
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--cui-bg-subtle)',
                  borderRadius: '4px',
                }}
              >
                <Container justifyContent="space-between">
                  <Text size="sm" color="muted">
                    Subtotal
                  </Text>
                  <Text size="sm">${totalAmount.toFixed(2)}</Text>
                </Container>

                {discountAmount > 0 && (
                  <Container justifyContent="space-between">
                    <Text size="sm" color="muted">
                      Discount ({promoCode})
                    </Text>
                    <Text size="sm" style={{ color: 'var(--cui-color-success)' }}>
                      -${discountAmount.toFixed(2)}
                    </Text>
                  </Container>
                )}

                <Separator orientation="horizontal" size="xs" />

                <Container justifyContent="space-between">
                  <Text weight="bold">Total Amount</Text>
                  <Text size="lg" weight="bold">
                    ${finalAmount.toFixed(2)}
                  </Text>
                </Container>
              </Container>
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
                  onClick={() => setSelectedPurchase(purchase.id)}
                  style={{
                    cursor: 'pointer',
                    border:
                      selectedPurchase === purchase.id
                        ? '2px solid var(--cui-color-primary)'
                        : '1px solid var(--cui-border-default)',
                  }}
                >
                  <>
                    <Container justifyContent="space-between" alignItems="start">
                      <Container orientation="vertical" gap="sm" style={{ flex: 1 }}>
                        <Container gap="sm" alignItems="center">
                          <Text size="sm" color="muted" style={{ fontFamily: 'mono' }}>
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
                        {purchase.discountAmount > 0 && (
                          <Text size="sm" style={{ color: 'var(--cui-color-success)' }}>
                            💰 Promo discount: -${purchase.discountAmount.toFixed(2)}
                          </Text>
                        )}
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
      {selectedPurchase && purchaseDetail && (
        <CardPrimary
          title="Process Refund"
          description={`Purchase #${selectedPurchase.slice(0, 8)} - ${purchaseDetail.productSnapshot?.name}`}
        >
          <>
            <Container orientation="vertical" gap="md">
              <Container
                gap="lg"
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--cui-bg-subtle)',
                  borderRadius: '4px',
                }}
              >
                <Container orientation="vertical" gap="xs">
                  <Text size="sm" color="muted">
                    Total Amount
                  </Text>
                  <Text weight="medium">${purchaseDetail.totalAmount.toFixed(2)}</Text>
                </Container>
                {purchaseDetail.discountAmount > 0 && (
                  <Container orientation="vertical" gap="xs">
                    <Text size="sm" color="muted">
                      Discount Applied
                    </Text>
                    <Text weight="medium" style={{ color: 'var(--cui-color-success)' }}>
                      ${purchaseDetail.discountAmount.toFixed(2)}
                    </Text>
                  </Container>
                )}
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
                  <Text weight="medium">${purchaseDetail.remainingAmount.toFixed(2)}</Text>
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

              {purchaseDetail.remainingAmount > 0 && (
                <>
                  <NumberField
                    loading={false}
                    label="Refund Amount"
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e)}
                  />
                  <TextField
                    label="Reason (optional)"
                    placeholder="Customer request, damaged item, etc."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e)}
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
                        index: number
                      ) => (
                        <div key={refund.id}>
                          {index > 0 && <Separator orientation="horizontal" size="xs" />}
                          <Container justifyContent="space-between" style={{ padding: '8px 0' }}>
                            <Text weight="medium">${refund.amount.toFixed(2)}</Text>
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
