import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { properties as propApi } from '../services/api'
import { useAuth } from '../context/useAuth'
import { ArrowLeft, Building, AlertCircle } from 'lucide-react'
import { bannerStyles, buttonStyles, inputStyles, surfaceCard } from '../components/ui'

const DISTRICTS = ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni']
const TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'commercial', label: 'Commercial' },
]

export default function CreateProperty() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment',
    district: 'Kinondoni', ward: '', street: '',
    bedrooms: 1, bathrooms: 1, rent_amount: '',
    deposit_amount: '', furnished: false,
    has_water: true, has_electricity: true, has_parking: false, has_security: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user || (user.role !== 'landlord' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Building className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">Landlord access required</h2>
          <Link to="/register" className="font-medium text-emerald-600 dark:text-emerald-400">Register as landlord</Link>
        </div>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = {
        ...form,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        rent_amount: Number(form.rent_amount),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      }
      const created = await propApi.create(body)
      navigate(`/properties/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className={surfaceCard('p-0')}>
          <div className="page-header-bg rounded-t-[1.75rem] px-6 py-6 sm:px-8">
            <div className="eyebrow mb-3">Landlord listing</div>
            <h1 className="mb-1 text-2xl font-bold text-slate-950 dark:text-white">List a Property</h1>
            <p className="text-slate-600 dark:text-slate-400">Add your rental to reach tenants across Dar es Salaam.</p>
          </div>

          {error && (
            <div className={bannerStyles('error', 'mx-6 mt-6 sm:mx-8')}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input type="text" placeholder="e.g. 2BR Modern Apartment in Kinondoni" value={form.title} onChange={set('title')} className={inputStyles()} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea placeholder="Describe your property..." value={form.description} onChange={set('description')} rows={3} className={inputStyles('resize-none')} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Type</label>
                <select value={form.property_type} onChange={set('property_type')} className={inputStyles()}>
                  {TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">District</label>
                <select value={form.district} onChange={set('district')} className={inputStyles()}>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Ward</label>
                <input type="text" placeholder="e.g. Msasani" value={form.ward} onChange={set('ward')} className={inputStyles()} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Street</label>
                <input type="text" placeholder="e.g. Old Bagamoyo Road" value={form.street} onChange={set('street')} className={inputStyles()} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bedrooms</label>
                <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className={inputStyles()} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bathrooms</label>
                <input type="number" min="0" value={form.bathrooms} onChange={set('bathrooms')} className={inputStyles()} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Rent (TZS/mo)</label>
                <input type="number" min="0" placeholder="500000" value={form.rent_amount} onChange={set('rent_amount')} className={inputStyles()} required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Deposit (TZS, optional)</label>
              <input type="number" min="0" placeholder="Same as rent" value={form.deposit_amount} onChange={set('deposit_amount')} className={inputStyles()} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Amenities</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { key: 'furnished', label: 'Furnished' },
                  { key: 'has_water', label: 'Water' },
                  { key: 'has_electricity', label: 'Electricity' },
                  { key: 'has_parking', label: 'Parking' },
                  { key: 'has_security', label: 'Security' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={set(key)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={buttonStyles({ fullWidth: true })}
            >
              {loading ? 'Listing...' : 'List Property'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
