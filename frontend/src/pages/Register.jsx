import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Home, Phone, Lock, User, AlertCircle, Mail, Building2, KeyRound } from 'lucide-react'
import { bannerStyles, buttonStyles, cn, leadingInputStyles } from '../components/ui'

const ROLES = [
  { value: 'renter', label: 'Renter', desc: 'Looking for a verified place', icon: KeyRound },
  { value: 'landlord', label: 'Landlord', desc: 'Listing and managing properties', icon: Building2 },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    phone: '',
    full_name: '',
    email: '',
    password: '',
    role: 'renter',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form)
      navigate(data.user?.role === 'landlord' || data.user?.role === 'admin' ? '/dashboard' : '/properties', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/82 shadow-[0_24px_60px_rgba(17,36,25,0.12)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] dark:border-white/8 dark:bg-slate-900/80">
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
              <div className="eyebrow mb-5 border-white/10 bg-white/8 text-emerald-50/78">Create account</div>
              <h1 className="mb-4 text-4xl font-bold leading-tight">Join a rental marketplace that feels more trustworthy from day one.</h1>
              <p className="text-sm leading-relaxed text-emerald-50/74">
                Whether you are searching for a home or managing properties, the experience should feel cleaner, safer, and easier to trust.
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
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Create your account</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Start finding or listing rentals in Dar</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white/88 p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800/80">
            {error && (
              <div className={bannerStyles('error', 'mb-6')}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">I am a</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ROLES.map(({ value, label, desc, icon }) => {
                    const Icon = icon
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, role: value })}
                        className={cn(
                          'rounded-[1.25rem] border-2 p-4 text-left transition-all',
                          form.role === value
                            ? 'border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-500 dark:bg-emerald-900/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
                        )}
                      >
                        <Icon className={cn('mb-3 h-5 w-5', form.role === value ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')} />
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="John Mwalimu" value={form.full_name} onChange={set('full_name')} className={leadingInputStyles()} required />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} className={leadingInputStyles()} required />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="tel" placeholder="0712345678" value={form.phone} onChange={set('phone')} className={leadingInputStyles()} required />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" placeholder="Create a password" value={form.password} onChange={set('password')} className={leadingInputStyles()} required minLength={6} />
                </div>
              </div>

              <button type="submit" disabled={loading} className={buttonStyles({ fullWidth: true })}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
