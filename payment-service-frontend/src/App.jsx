import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PaymentsList from './pages/PaymentsList'
import Checkout from './pages/Checkout'
import PaymentDetail from './pages/PaymentDetail'
import Invoice from './pages/Invoice'
import UserPayments from './pages/UserPayments'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="payments" element={<PaymentsList />} />
          <Route path="payments/checkout" element={<Checkout />} />
          <Route path="payments/checkout/:orderId/user/:userId" element={<Checkout />} />
          <Route path="payments/:id/invoice" element={<Invoice />} />
          <Route path="payments/:id" element={<PaymentDetail />} />
          <Route path="user/payments" element={<UserPayments />} />
          <Route path="user/:userId/payments" element={<UserPayments />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
