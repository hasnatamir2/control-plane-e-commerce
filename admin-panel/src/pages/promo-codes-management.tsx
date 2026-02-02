import React, { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promoCodeApi, type ErrorReponse, type PromoCode } from '../lib/api'
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
  Table,
  Separator,
  type BadgeState,
  DatePicker,
} from '@clickhouse/click-ui'
import { format } from 'date-fns'

export const PromoCodeManagement: React.FC = () => {
  const { createToast } = useToast()
  const queryClient = useQueryClient()

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [value, setValue] = useState('')
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [maxUsageCount, setMaxUsageCount] = useState('')
  const [validFrom, setValidFrom] = useState(new Date())
  const [validUntil, setValidUntil] = useState(new Date())

  // Fetch promo codes
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['promoCode'],
    queryFn: promoCodeApi.list,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: promoCodeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCode'] })
      createToast({ title: 'Promo code created successfully!', type: 'success' })
      resetForm()
    },
    onError: (error: ErrorReponse) => {
      createToast({
        title: 'Failed to create promo code',
        description: error.response?.data?.error?.message,
        type: 'danger',
      })
    },
  })

  // Disable mutation
  //   const disableMutation = useMutation({
  //     mutationFn: promoCodeApi.disable,
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ['promoCode'] })
  //       createToast({ title: 'Promo code disabled', type: 'success' })
  //     },
  //     onError: (error: any) => {
  //       createToast({
  //         title: 'Failed to disable promo code',
  //         description: error.response?.data?.error?.message,
  //         type: 'danger',
  //       })
  //     },
  //   })

  const handleCreate = () => {
    if (!code || !value || !validFrom || !validUntil) {
      createToast({ title: 'Please fill in required fields', type: 'danger' })
      return
    }

    createMutation.mutate({
      code,
      type,
      value: parseFloat(value),
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      maxUsageCount: maxUsageCount ? parseInt(maxUsageCount) : undefined,
      validFrom,
      validUntil: new Date(validUntil),
    })
  }

  //   const handleDisable = (id: string) => {
  //     if (confirm('Are you sure you want to disable this promo code?')) {
  //       disableMutation.mutate(id)
  //     }
  //   }

  const resetForm = () => {
    setCode('')
    setValue('')
    setMinPurchaseAmount('')
    setMaxDiscountAmount('')
    setMaxUsageCount('')
    setValidFrom(new Date())
    setValidUntil(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success'
      case 'EXPIRED':
        return 'warning'
      case 'DISABLED':
        return 'danger'
      case 'USED_UP':
        return 'default'
      default:
        return 'default'
    }
  }

  const promocodeHeader = useCallback(() => {
    return [
      { label: 'Code' },
      { label: 'Type' },
      { label: 'Usage' },
      { label: 'Valid Period' },
      { label: 'Status' },
      { label: 'Actions' },
    ]
  }, [])

  const promoCodeRows = useCallback((promoCodes: PromoCode[]) => {
    if (!promoCodes || (promoCodes && !promoCodes.length)) return []
    return promoCodes.map((promoCode) => ({
      id: promoCode.id,
      items: [
        {
          label: <Text weight="bold">{promoCode.code}</Text>,
        },
        {
          label: (
            <Text size="sm">
              {promoCode.type === 'PERCENTAGE'
                ? `${promoCode.value}% off`
                : `$${promoCode.value} off`}
            </Text>
          ),
        },
        {
          label: (
            <Text size="sm">
              {promoCode.currentUsageCount}
              {promoCode.maxUsageCount ? ` / ${promoCode.maxUsageCount}` : ' / ∞'}
            </Text>
          ),
        },
        {
          label: (
            <Text size="sm">
              {format(new Date(promoCode.validFrom), 'MMM d, yyyy')} -{' '}
              {format(new Date(promoCode.validUntil), 'MMM d, yyyy')}
            </Text>
          ),
        },
        {
          label: (
            <Badge state={getStatusColor(promoCode.status) as BadgeState} text={promoCode.status} />
          ),
        },
        {
          label: <Button type="danger">Disable</Button>,
        },
      ],
    }))
  }, [])

  return (
    <Container orientation="vertical" gap="lg">
      <div>
        <Text size="lg" weight="bold">
          Promo Code Management
        </Text>
        <Text color="muted">Create and manage discount promo codes</Text>
      </div>

      {/* Create Promo Code */}
      <CardPrimary title="Create New Promo Code" description="Add a new discount code">
        <>
          <Container orientation="vertical" gap="md">
            <Container gap="md">
              <TextField
                label="Promo Code *"
                placeholder="SUMMER2024"
                value={code}
                onChange={(e) => setCode(e.toUpperCase())}
                style={{ flex: 1 }}
              />
              <div style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                  Type *
                </Text>
                <Select
                  value={type}
                  onSelect={(value) => setType(value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Percentage Discount', value: 'PERCENTAGE' },
                    { label: 'Fixed Amount', value: 'FIXED_AMOUNT' },
                  ]}
                />
              </div>
            </Container>

            <Container gap="md">
              <NumberField
                id="value"
                loading={false}
                label={type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                placeholder={type === 'PERCENTAGE' ? '10' : '50.00'}
                value={value}
                onChange={(e) => setValue(e)}
                style={{ flex: 1 }}
              />
              <NumberField
                id="minPurchase"
                loading={false}
                label="Minimum Purchase Amount ($)"
                placeholder="100.00"
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e)}
                style={{ flex: 1 }}
              />
            </Container>

            <Container gap="md">
              <NumberField
                id="maxDiscount"
                loading={false}
                label="Max Discount Amount ($)"
                placeholder="500.00"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e)}
                style={{ flex: 1 }}
              />
              <NumberField
                id="maxUsage"
                label="Max Usage Count"
                loading={false}
                placeholder="100"
                value={maxUsageCount}
                onChange={(e) => setMaxUsageCount(e)}
                style={{ flex: 1 }}
              />
            </Container>

            <Container gap="md">
              <div style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                  Valid From *
                </Text>
                <DatePicker date={validFrom} onSelectDate={setValidFrom} />
              </div>
              <div style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ marginBottom: '8px' }}>
                  Valid Until *
                </Text>
                <DatePicker date={validUntil} onSelectDate={setValidUntil} />
              </div>
            </Container>

            <Separator orientation="horizontal" size="md" />

            <Container gap="md">
              <Button
                onClick={handleCreate}
                loading={createMutation.isPending}
                type="primary"
                style={{ flex: 1 }}
              >
                Create Promo Code
              </Button>
              <Button onClick={resetForm} type="secondary" style={{ flex: 1 }}>
                Reset Form
              </Button>
            </Container>

            <Text size="sm" color="muted">
              * Required fields
            </Text>
          </Container>
        </>
      </CardPrimary>

      {/* Promo Code List */}
      <CardPrimary title="All Promo Codes" description={`${promoCodes?.length || 0} promo codes`}>
        <>
          {isLoading ? (
            <Text>Loading promo codes...</Text>
          ) : !promoCodes || promoCodes.length === 0 ? (
            <Text color="muted">No promo codes yet. Create one above!</Text>
          ) : (
            <Table rows={promoCodeRows(promoCodes)} headers={promocodeHeader()} />
          )}
        </>
      </CardPrimary>

      {/* Usage Guide */}
      <CardPrimary title="How to Use Promo Codes">
        <>
          <Container orientation="vertical" gap="sm">
            <Text size="sm">
              <strong>1. Create a promo code</strong> with the form above
            </Text>
            <Text size="sm">
              <strong>2. Share the code</strong> with customers
            </Text>
            <Text size="sm">
              <strong>3. Customers enter the code</strong> when making a purchase
            </Text>
            <Text size="sm">
              <strong>4. Discount is applied</strong> automatically to their total
            </Text>

            <Separator orientation="horizontal" size="sm" />

            <Text size="sm" weight="bold">
              Promo Code Types:
            </Text>
            <ul style={{ marginLeft: '20px' }}>
              <li>
                <Text size="sm">
                  <strong>Percentage:</strong> X% off the purchase (e.g., 10% off)
                </Text>
              </li>
              <li>
                <Text size="sm">
                  <strong>Fixed Amount:</strong> $X off the purchase (e.g., $50 off)
                </Text>
              </li>
            </ul>

            <Separator orientation="horizontal" size="sm" />

            <Text size="sm" weight="bold">
              Optional Restrictions:
            </Text>
            <ul style={{ marginLeft: '20px' }}>
              <li>
                <Text size="sm">
                  <strong>Min Purchase:</strong> Code only works if purchase is above this amount
                </Text>
              </li>
              <li>
                <Text size="sm">
                  <strong>Max Discount:</strong> Caps the discount amount (useful for percentage
                  codes)
                </Text>
              </li>
              <li>
                <Text size="sm">
                  <strong>Max Usage:</strong> Limits how many times the code can be used
                </Text>
              </li>
            </ul>
          </Container>
        </>
      </CardPrimary>
    </Container>
  )
}
