import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { agents as agentApi } from '../services/api'
import { Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { bannerStyles, buttonStyles, inputStyles, surfaceCard } from '../components/ui'

const DISTRICTS = ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni']

export default function AgentApply() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    business_name: '', license_number: '', bio: '', operating_districts: '',
  })
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const toggleDistrict = (d) => {
    const next = selectedDistricts.includes(d)
      ? selectedDistricts.filter((x) => x !== d)
      : [...selectedDistricts, d]
    setSelectedDistricts(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedDistricts.length === 0) {
      setError('Select at least one operating district')
      return
    }
    setLoading(true)
    setError('')
    try {
      await agentApi.apply({ ...form, operating_districts: selectedDistricts.join(',') })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">Sign in to apply</h2>
          <Link to="/login" className="font-medium text-emerald-600 dark:text-emerald-400">Sign in</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className={surfaceCard('max-w-md text-center')}>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white">Application submitted</h2>
          <p className="mb-6 text-slate-500 dark:text-slate-400">
            Our team will review your application. You'll be notified once approved. Verified agents get a badge, commission tracking, and priority support.
          </p>
          <Link to="/agents" className={buttonStyles()}>
            View Agents
          </Link>
        </div>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-xl px-4">
        <Link to="/agents" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" /> Back to agents
        </Link>

        <div className={surfaceCard('p-0')}>
          <div className="page-header-bg rounded-t-[1.75rem] px-6 py-6 text-center sm:px-8">
            <Shield className="mx-auto mb-2 h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Become a Verified Agent</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Turn your market knowledge into verified income.</p>
          </div>

          {error && (
            <div className={bannerStyles('error', 'mx-6 mt-6 sm:mx-8')}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Karibu Properties"
                value={form.business_name}
                onChange={set('business_name')}
                className={inputStyles()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">License Number (optional)</label>
              <input
                type="text"
                placeholder="Real estate license #"
                value={form.license_number}
                onChange={set('license_number')}
                className={inputStyles()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">About You</label>
              <textarea
                placeholder="Tell landlords and renters about your experience..."
                value={form.bio}
                onChange={set('bio')}
                rows={3}
                className={inputStyles('resize-none')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Operating Districts</label>
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistrict(d)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedDistricts.includes(d)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={buttonStyles({ fullWidth: true })}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
