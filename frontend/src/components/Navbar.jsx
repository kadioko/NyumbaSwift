import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Home, Search, LayoutDashboard, Users, LogOut, Menu, X, ShieldCheck } from 'lucide-react'
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
  const isAdmin = user?.role === 'admin'

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 leading-none block">NyumbaSwift</span>
                <span className="text-[11px] text-gray-500">Verified rentals in Dar</span>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/properties" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
              <Search className="w-4 h-4" />
              <span>Find Rentals</span>
            </Link>
            <Link to="/agents" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
              <Users className="w-4 h-4" />
              <span>Agents</span>
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" className="text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
                    My Rentals
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <Link to="/profile" className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                      {user.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{user.full_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs capitalize text-gray-500">{user.role}</span>
                        {isAdmin && <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck className="w-3 h-3" />Admin</span>}
                      </div>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link to="/login" className="text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
                  Sign In
                </Link>
                <Link to="/register" className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-colors text-sm font-medium shadow-sm">
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
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md pb-4">
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
