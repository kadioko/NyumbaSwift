import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Home, Search, LayoutDashboard, Users, LogOut, Menu, X, ShieldCheck, Sparkles } from 'lucide-react'
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
    <nav className="sticky top-0 z-50 border-b border-white/30 bg-white/72 backdrop-blur-xl supports-[backdrop-filter]:bg-white/62">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 shadow-[0_12px_28px_rgba(16,99,76,0.24)]">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-xl font-bold leading-none text-slate-950">NyumbaSwift</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Verified rentals in Dar</span>
              </div>
            </Link>
            <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/85 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Trust-first marketplace
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/properties" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
              <Search className="w-4 h-4" />
              <span>Find Rentals</span>
            </Link>
            <Link to="/agents" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
              <Users className="w-4 h-4" />
              <span>Agents</span>
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                    My Rentals
                  </Link>
                )}
                <div className="ml-2 flex items-center gap-3 border-l border-slate-200/80 pl-4">
                  <Link to="/profile" className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/70">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {user.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{user.full_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs capitalize text-slate-500">{user.role}</span>
                        {isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700"><ShieldCheck className="w-3 h-3" />Admin</span>}
                      </div>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-red-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-4 flex items-center gap-3">
                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,127,95,0.24)] transition-transform hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-800">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="flex items-center rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 md:hidden">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/40 bg-white/90 pb-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2 px-4 pt-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
              Safer discovery, verified actors, and cleaner rent workflows.
            </div>
            <Link to="/properties" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
              Find Rentals
            </Link>
            <Link to="/agents" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
              Verified Agents
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                    Dashboard
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                    My Rentals
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                  Profile
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,127,95,0.22)]">
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
