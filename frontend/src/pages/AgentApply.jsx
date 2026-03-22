import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { agents as agentApi } from '../services/api'
import { Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to apply</h2>
          <Link to="/login" className="text-emerald-600 font-medium">Sign in</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Our team will review your application. You'll be notified once approved. Verified agents get a badge, commission tracking, and priority support.
          </p>
          <Link to="/agents" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700">
            View Agents
          </Link>
        </div>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to agents
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">Become a Verified Agent</h1>
            <p className="text-gray-500 mt-1">Turn your market knowledge into verified income</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Karibu Properties"
                value={form.business_name}
                onChange={set('business_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number (optional)</label>
              <input
                type="text"
                placeholder="Real estate license #"
                value={form.license_number}
                onChange={set('license_number')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">About You</label>
              <textarea
                placeholder="Tell landlords and renters about your experience..."
                value={form.bio}
                onChange={set('bio')}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operating Districts</label>
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistrict(d)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedDistricts.includes(d)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
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
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
