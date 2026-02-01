import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreditManagement } from './pages/credit-management'
import { PurchaseManagement } from './pages/purchase-management'
import { Text, Tabs, ClickUIProvider, ToastProvider, Logo } from '@clickhouse/click-ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const location = useLocation()
  const activeTab = location.pathname === '/purchases' ? 'purchases' : 'credits'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid var(--cui-border-default)', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            size="lg"
            weight="bold"
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Logo name="clickhouse" size="sm" /> Clickhouse
          </Text>
          <Text size="lg" weight="bold">
            Control Plane Admin Panel
          </Text>
          <Tabs value={activeTab}>
            <Tabs.TriggersList>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Tabs.Trigger value="credits">Credits</Tabs.Trigger>
              </Link>
              <Link to="/purchases" style={{ textDecoration: 'none' }}>
                <Tabs.Trigger value="purchases">Purchases</Tabs.Trigger>
              </Link>
            </Tabs.TriggersList>
          </Tabs>
        </div>
      </div>

      <main
        style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}
      >
        <Routes>
          <Route path="/" element={<CreditManagement />} />
          <Route path="/purchases" element={<PurchaseManagement />} />
        </Routes>
      </main>

      <footer style={{ borderTop: '1px solid var(--cui-border-default)', padding: '16px 24px' }}>
        <Text size="sm" color="muted" align="center">
          E-Commerce Platform Admin Panel - Built with React + ClickHouse Click UI
        </Text>
      </footer>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClickUIProvider theme="light">
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ClickUIProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
