import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import CreateProperty from './pages/CreateProperty'
import Dashboard from './pages/Dashboard'
import MyRentals from './pages/MyRentals'
import Agents from './pages/Agents'
import AgentApply from './pages/AgentApply'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/new" element={<CreateProperty />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-rentals" element={<MyRentals />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/apply" element={<AgentApply />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
