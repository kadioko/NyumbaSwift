import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Search, LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isLandlord = user?.role === 'landlord' || user?.role === 'admin'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">NyumbaSwift</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/properties" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors">
              <Search className="w-4 h-4" />
              <span>Find Rentals</span>
            </Link>
            <Link to="/agents" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors">
              <Users className="w-4 h-4" />
              <span>Agents</span>
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" className="text-gray-600 hover:text-emerald-600 transition-colors">
                    My Rentals
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <Link to="/profile" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                      {user.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{user.full_name}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link to="/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden flex items-center text-gray-500">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white pb-4">
          <div className="flex flex-col px-4 pt-2 gap-1">
            <Link to="/properties" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Find Rentals
            </Link>
            <Link to="/agents" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Verified Agents
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    Dashboard
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    My Rentals
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                  Profile
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="mx-3 mt-2 bg-emerald-600 text-white text-center px-4 py-2 rounded-lg">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
