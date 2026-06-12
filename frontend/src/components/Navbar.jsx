import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { Home, Search, LayoutDashboard, Users, LogOut, Menu, X, ShieldCheck, Sparkles, Wallet, Moon, Sun, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { wallet as walletApi } from '../services/api'

function fmt(n) {
  return (n ?? 0).toLocaleString()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isLandlord = user?.role === 'landlord' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    let active = true

    async function loadBalance() {
      if (!user) {
        setWalletBalance(null)
        return
      }
      setLoadingBalance(true)
      try {
        const data = await walletApi.get()
        if (active) {
          setWalletBalance(data.balance_tzs ?? 0)
        }
      } catch {
        if (active) {
          setWalletBalance(null)
        }
      } finally {
        if (active) {
          setLoadingBalance(false)
        }
      }
    }

    loadBalance()

    const handleWalletUpdated = () => loadBalance()
    window.addEventListener('nyumbaswift:wallet-updated', handleWalletUpdated)
    return () => {
      active = false
      window.removeEventListener('nyumbaswift:wallet-updated', handleWalletUpdated)
    }
  }, [user, location.pathname])

  return (
    <nav className="navbar-bar sticky top-0 z-50 border-b border-white/30 bg-white/72 backdrop-blur-xl supports-[backdrop-filter]:bg-white/62 dark:border-white/8 dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 shadow-[0_12px_28px_rgba(16,99,76,0.24)]">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-xl font-bold leading-none text-slate-950 dark:text-white">NyumbaSwift</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Verified rentals in Dar</span>
              </div>
            </Link>
            <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/85 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Trust-first marketplace
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/properties" className="navbar-link flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
              <Search className="w-4 h-4" />
              <span>Find Rentals</span>
            </Link>
            <Link to="/agents" className="navbar-link flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
              <Users className="w-4 h-4" />
              <span>Agents</span>
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" className="navbar-link flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" className="navbar-link rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
                    My Rentals
                  </Link>
                )}
                <Link to="/wallet" className="navbar-link flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet</span>
                </Link>
                <div className="inline-flex items-center gap-1 rounded-2xl border border-emerald-100 bg-emerald-50/90 p-1 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Link
                    to="/wallet"
                    className="inline-flex items-center gap-2 rounded-[1rem] px-2.5 py-1.5 transition-colors hover:bg-white/70 dark:hover:bg-emerald-900/50"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>{loadingBalance ? 'Loading balance...' : `TZS ${fmt(walletBalance)}`}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('nyumbaswift:wallet-updated'))}
                    className="rounded-full p-1.5 text-emerald-700/70 hover:bg-white/70 dark:text-emerald-300"
                    title="Refresh wallet balance"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingBalance ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="ml-2 flex items-center gap-3 border-l border-slate-200/80 pl-4 dark:border-slate-700">
                  <Link to="/profile" className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/70 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-700 dark:hover:bg-slate-700">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      {user.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role}</span>
                        {isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"><ShieldCheck className="w-3 h-3" />Admin</span>}
                      </div>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-700 dark:hover:text-red-400">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-4 flex items-center gap-3">
                <Link to="/login" className="navbar-link rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400">
                  Sign In
                </Link>
                <Link to="/register" className="navbar-primary rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,127,95,0.24)] transition-transform hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-800">
                  Get Started
                </Link>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile theme toggle */}
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={() => setOpen(!open)} className="flex items-center rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="navbar-mobile-panel border-t border-white/40 bg-white/90 pb-5 backdrop-blur-xl md:hidden dark:border-white/8 dark:bg-slate-950/95">
          <div className="flex flex-col gap-2 px-4 pt-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              Safer discovery, verified actors, and cleaner rent workflows.
            </div>
            <Link to="/properties" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
              Find Rentals
            </Link>
            <Link to="/agents" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
              Verified Agents
            </Link>
            {user ? (
              <>
                {isLandlord && (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
                    Dashboard
                  </Link>
                )}
                {!isLandlord && (
                  <Link to="/my-rentals" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
                    My Rentals
                  </Link>
                )}
                <Link to="/wallet" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
                  Wallet
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
                  Profile
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/30">
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
