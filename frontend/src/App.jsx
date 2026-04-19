import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useAuth } from './context/useAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import CreateProperty from './pages/CreateProperty'
import EditProperty from './pages/EditProperty'
import Dashboard from './pages/Dashboard'
import MyRentals from './pages/MyRentals'
import Agents from './pages/Agents'
import AgentApply from './pages/AgentApply'
import Profile from './pages/Profile'
import AboutNyumbaSwift from './pages/AboutNyumbaSwift'
import BecomeAgentInfo from './pages/BecomeAgentInfo'
import TermsConditions from './pages/TermsConditions'
import PrivacyPolicy from './pages/PrivacyPolicy'

function getDefaultRoute(user) {
  if (!user) return '/login'
  return user.role === 'landlord' || user.role === 'admin' ? '/dashboard' : '/properties'
}

function RouteGate({ requireAuth = false, allowedRoles = null }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!requireAuth && user) {
    return <Navigate to={getDefaultRoute(user)} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user)} replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <div className="app-shell min-h-screen flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/about" element={<AboutNyumbaSwift />} />
          <Route path="/become-an-agent" element={<BecomeAgentInfo />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route element={<RouteGate />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RouteGate requireAuth />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-rentals" element={<MyRentals />} />
            <Route path="/agents/apply" element={<AgentApply />} />
          </Route>

          <Route element={<RouteGate requireAuth allowedRoles={['landlord', 'admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties/new" element={<CreateProperty />} />
            <Route path="/properties/:id/edit" element={<EditProperty />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
