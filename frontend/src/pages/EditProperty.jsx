import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, Building, Loader2 } from 'lucide-react'
import { properties as propApi } from '../services/api'
import { useAuth } from '../context/useAuth'

export default function EditProperty() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: '',
    furnished: false,
    status: 'inactive',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProperty() {
      setLoading(true)
      setError('')
      try {
        const data = await propApi.get(id)
        if (ignore) return
        setProperty(data)
        setForm({
          title: data.title || '',
          description: data.description || '',
          bedrooms: data.bedrooms ?? 1,
          bathrooms: data.bathrooms ?? 1,
          rent_amount: data.rent_amount ?? '',
          furnished: Boolean(data.furnished),
          status: data.status === 'active' || data.status === 'inactive' ? data.status : 'inactive',
        })
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to load this property right now.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadProperty()
    return () => {
      ignore = true
    }
  }, [id])

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

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await propApi.update(Number(id), {
        title: form.title,
        description: form.description,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        rent_amount: Number(form.rent_amount),
        furnished: form.furnished,
        status: form.status,
      })
      setProperty(updated)
      setForm({
        title: updated.title || '',
        description: updated.description || '',
        bedrooms: updated.bedrooms ?? 1,
        bathrooms: updated.bathrooms ?? 1,
        rent_amount: updated.rent_amount ?? '',
        furnished: Boolean(updated.furnished),
        status: updated.status === 'active' || updated.status === 'inactive' ? updated.status : 'inactive',
      })
      setSuccess(
        updated.status === 'pending_verification' && !updated.is_verified
          ? 'Property updated successfully. Your listing is now pending verification again because you changed listing details.'
          : 'Property updated successfully.'
      )
    } catch (err) {
      setError(err.message || 'Unable to update this property right now.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <Link to={`/properties/${id}`} className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
            View listing
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Property</h1>
            <p className="text-gray-500">Update your listing details and availability settings.</p>
          </div>

          {property && (
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${property.status === 'active' ? 'bg-emerald-100 text-emerald-700' : property.status === 'pending_verification' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {property.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${property.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {property.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          )}

          {property?.is_verified && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
              Changing listing details will send this property back to pending verification until an admin reviews it again.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && !error && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={set('title')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <input type="number" min="0" value={form.rent_amount} onChange={set('rent_amount')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  disabled={!property?.is_verified}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
                {!property?.is_verified && (
                  <p className="text-xs text-gray-500 mt-2">This listing can only be activated after verification.</p>
                )}
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.furnished}
                    onChange={set('furnished')}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Furnished</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
