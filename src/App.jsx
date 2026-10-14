import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AiResultsPage } from './pages/AiResultsPage'
import { CreateOrderPage } from './pages/CreateOrderPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MatcherPage } from './pages/MatcherPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrderSummaryPage } from './pages/OrderSummaryPage'
import { OrdersPage } from './pages/OrdersPage'
import { PaySharePage } from './pages/PaySharePage'
import { ProfileCompanyPage } from './pages/ProfileCompanyPage'
import { ProfileHelpPage } from './pages/ProfileHelpPage'
import { ProfileNotificationsPage } from './pages/ProfileNotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfilePaymentPage } from './pages/ProfilePaymentPage'
import { RegisterPage } from './pages/RegisterPage'
import { VotePage } from './pages/VotePage'
import { WelcomePage } from './pages/WelcomePage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<WelcomePage />} />
        <Route path="/login/enter" element={<LoginPage />} />
        <Route path="/login/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<CreateOrderPage />} />
            <Route path="orders/:id/vote" element={<VotePage />} />
            <Route path="orders/:id/summary" element={<OrderSummaryPage />} />
            <Route path="orders/:id/pay" element={<PaySharePage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="matcher" element={<MatcherPage />} />
            <Route path="matcher/results" element={<AiResultsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/payment" element={<ProfilePaymentPage />} />
            <Route
              path="profile/notifications"
              element={<ProfileNotificationsPage />}
            />
            <Route path="profile/company" element={<ProfileCompanyPage />} />
            <Route path="profile/help" element={<ProfileHelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
