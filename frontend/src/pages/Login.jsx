import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Home, Phone, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login, authNotice, clearAuthNotice } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getDefaultRoute = (user) => (user?.role === 'landlord' || user?.role === 'admin' ? '/dashboard' : '/properties')

  useEffect(() => {
    return () => clearAuthNotice()
  }, [clearAuthNotice])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    clearAuthNotice()
    setLoading(true)
    try {
      const data = await login(form)
      const requestedPath = location.state?.from?.pathname
      const nextPath = requestedPath && requestedPath !== '/login' && requestedPath !== '/register'
        ? requestedPath
        : getDefaultRoute(data.user)
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/82 shadow-[0_24px_60px_rgba(17,36,25,0.12)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] dark:border-white/8 dark:bg-slate-900/80">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-10 text-white lg:block">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute -left-10 top-16 h-44 w-44 rounded-full bg-emerald-300 blur-3xl" />
            <div className="absolute bottom-4 right-4 h-56 w-56 rounded-full bg-amber-300 blur-3xl" />
          </div>
          <div className="relative">
            <Link to="/" className="mb-12 inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">NyumbaSwift</div>
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-100/60">Verified rentals in Dar</div>
              </div>
            </Link>
            <div className="max-w-sm">
              <div className="eyebrow mb-5 border-white/10 bg-white/8 text-emerald-50/78">Sign in securely</div>
              <h1 className="mb-4 text-4xl font-bold leading-tight">Access your properties, payments, and renter activity.</h1>
              <p className="text-sm leading-relaxed text-emerald-50/74">
                The landlord and renter experience should feel more professional than a chat thread. That starts the moment you sign in.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                <Home className="h-6 w-6 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Welcome back</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Sign in to your NyumbaSwift account</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white/88 p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800/80">
            {authNotice && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {authNotice}
              </div>
            )}
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 font-semibold text-white shadow-[0_16px_28px_rgba(15,127,95,0.22)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
