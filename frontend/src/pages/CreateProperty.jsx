import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { properties as propApi } from '../services/api'
import { useAuth } from '../context/useAuth'
import { ArrowLeft, Building, AlertCircle, CheckCircle } from 'lucide-react'

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Landlord access required</h2>
          <Link to="/register" className="text-emerald-600 font-medium">Register as landlord</Link>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">List a Property</h1>
          <p className="text-gray-500 mb-6">Add your rental to reach thousands of tenants in Dar</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input type="text" placeholder="e.g. 2BR Modern Apartment in Kinondoni" value={form.title} onChange={set('title')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea placeholder="Describe your property..." value={form.description} onChange={set('description')} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
                <select value={form.property_type} onChange={set('property_type')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  {TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
                <select value={form.district} onChange={set('district')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ward</label>
                <input type="text" placeholder="e.g. Msasani" value={form.ward} onChange={set('ward')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Street</label>
                <input type="text" placeholder="e.g. Old Bagamoyo Road" value={form.street} onChange={set('street')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
                <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
                <input type="number" min="0" value={form.bathrooms} onChange={set('bathrooms')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rent (TZS/mo)</label>
                <input type="number" min="0" placeholder="500000" value={form.rent_amount} onChange={set('rent_amount')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deposit (TZS, optional)</label>
              <input type="number" min="0" placeholder="Same as rent" value={form.deposit_amount} onChange={set('deposit_amount')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'furnished', label: 'Furnished' },
                  { key: 'has_water', label: 'Water' },
                  { key: 'has_electricity', label: 'Electricity' },
                  { key: 'has_parking', label: 'Parking' },
                  { key: 'has_security', label: 'Security' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={set(key)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Listing...' : 'List Property'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
