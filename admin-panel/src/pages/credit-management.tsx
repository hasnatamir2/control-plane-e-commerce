import React, { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditApi, mockApi, type CreditTransaction } from '../lib/api'
import {
  CardPrimary,
  Button,
  TextField,
  Select,
  Text,
  Badge,
  NumberField,
  Container,
  useToast,
  BigStat,
  DateDetails,
  Table,
  type BadgeState,
} from '@clickhouse/click-ui'
import { format } from 'date-fns'

export const CreditManagement: React.FC = () => {
  const { createToast } = useToast()

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    '550e8400-e29b-41d4-a716-446655440001'
  )
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: mockApi.getCustomers,
  })

  // Fetch balance
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ['balance', selectedCustomerId],
    queryFn: () => creditApi.getBalance(selectedCustomerId),
    enabled: !!selectedCustomerId,
  })

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', selectedCustomerId],
    queryFn: () => creditApi.getTransactions(selectedCustomerId),
    enabled: !!selectedCustomerId,
  })

  // Grant mutation
  const grantMutation = useMutation({
    mutationFn: ({
      customerId,
      amount,
      reason,
    }: {
      customerId: string
      amount: number
      reason: string
    }) => creditApi.grant(customerId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      createToast({ title: 'Credit granted successfully' })
      setAmount('')
      setReason('')
    },
    onError: (error: any) => {
      createToast({
        type: 'danger',
        title: 'Failed to grant credit',
        description: error.response?.data?.error?.message,
      })
    },
  })

  // Deduct mutation
  const deductMutation = useMutation({
    mutationFn: ({
      customerId,
      amount,
      reason,
    }: {
      customerId: string
      amount: number
      reason: string
    }) => creditApi.deduct(customerId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      createToast({ title: 'Credit deducted successfully' })
      setAmount('')
      setReason('')
    },
    onError: (error: any) => {
      createToast({
        type: 'danger',
        title: 'Failed to deduct credit',
        description: error.response?.data?.error?.message,
      })
    },
  })

  const handleGrant = () => {
    if (!amount || !reason) {
      createToast({ title: 'Please fill in all fields', type: 'danger' })
      return
    }
    grantMutation.mutate({
      customerId: selectedCustomerId,
      amount: parseFloat(amount),
      reason,
    })
  }

  const handleDeduct = () => {
    if (!amount || !reason) {
      createToast({ title: 'Please fill in all fields', type: 'danger' })
      return
    }
    deductMutation.mutate({
      customerId: selectedCustomerId,
      amount: parseFloat(amount),
      reason,
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'GRANT':
        return 'success'
      case 'DEDUCT':
        return 'danger'
      case 'REFUND':
        return 'info'
      default:
        return 'default'
    }
  }

  const transactionHeader = useCallback(() => {
    return [
      { label: 'TransactionId' },
      { label: 'Total Amount' },
      { label: 'Status' },
      { label: 'Balance Before' },
      { label: 'Balance After' },
      { label: 'Reason' },
      { label: 'Created At' },
    ]
  }, [])

  const transactionRows = useCallback((transactions: CreditTransaction[]) => {
    if (!transactions || (transactions && !transactions.length)) return []
    return transactions.map((transaction) => ({
      id: transaction.id,
      items: [
        {
          label: `#${transaction.id.slice(0, 8)}`,
        },
        {
          label: `$${transaction.amount.toFixed(2)}`,
        },
        {
          label: (
            <Badge state={getTypeColor(transaction.type) as BadgeState} text={transaction.type} />
          ),
        },
        {
          label: `$${transaction.balanceBefore.toFixed(2)}`,
        },
        {
          label: `$${transaction.balanceAfter.toFixed(2)}`,
        },
        {
          label: transaction.reason,
        },
        {
          label: format(new Date(transaction.createdAt), 'PPpp'),
        },
      ],
    }))
  }, [])

  return (
    <Container orientation="vertical" gap="lg">
      <div>
        <Text size="lg" weight="bold">
          Credit Management
        </Text>
        <Text color="muted">Manage customer credit balances and view transaction history</Text>
      </div>

      {/* Customer Selection */}
      <CardPrimary title="Select Customer">
        <>
          <Select
            value={selectedCustomerId}
            onSelect={(value) => setSelectedCustomerId(value as string)}
            style={{ width: '100%' }}
            options={customers?.map((customer: { name: string; email: string; id: string }) => ({
              label: `${customer.name} (${customer.email})`,
              value: customer.id,
            }))}
          />
        </>
      </CardPrimary>

      {/* Balance Display */}
      <CardPrimary title="Current Balance">
        <>
          {loadingBalance ? (
            <Text>Loading...</Text>
          ) : (
            <Container orientation="vertical" gap="sm">
              <BigStat title={`$${balance?.currentBalance.toFixed(2)}`} label="Balance" fillWidth />

              <Text size="sm" color="muted">
                {balance && (
                  <>
                    Last updated: <DateDetails date={new Date(balance.lastUpdated)} />
                  </>
                )}
              </Text>
            </Container>
          )}
        </>
      </CardPrimary>

      {/* Grant/Deduct Credit */}
      <CardPrimary
        title="Manage Credit"
        description="Grant or deduct credit for the selected customer"
      >
        <>
          <Container orientation="vertical" gap="md">
            <NumberField
              id="amount"
              label="Amount"
              placeholder="100.00"
              loading={false}
              value={amount}
              onChange={(e) => setAmount(e)}
            />
            <TextField
              label="Reason"
              placeholder="e.g., Promotional credit, Adjustment, etc."
              value={reason}
              onChange={(e) => setReason(e)}
            />
            <Container gap="md">
              <Button
                onClick={handleGrant}
                loading={grantMutation.isPending}
                type="primary"
                style={{ flex: 1 }}
              >
                Grant Credit
              </Button>
              <Button
                onClick={handleDeduct}
                loading={deductMutation.isPending}
                type="danger"
                style={{ flex: 1 }}
              >
                Deduct Credit
              </Button>
            </Container>
          </Container>
        </>
      </CardPrimary>

      {/* Transaction History */}
      <CardPrimary title="Transaction History">
        <>
          <Container orientation="vertical" gap="md">
            {!isLoading && transactions?.length === 0 && (
              <Text color="muted">No transactions yet</Text>
            )}
            <Table
              rows={transactionRows(transactions as CreditTransaction[])}
              headers={transactionHeader()}
              loading={isLoading}
            />
          </Container>
        </>
      </CardPrimary>
    </Container>
  )
}
