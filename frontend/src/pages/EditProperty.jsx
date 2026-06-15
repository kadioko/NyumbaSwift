import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, Building, Loader2 } from 'lucide-react'
import { properties as propApi } from '../services/api'
import { useAuth } from '../context/useAuth'
import { bannerStyles, buttonStyles, inputStyles, surfaceCard } from '../components/ui'

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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Building className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h2 className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">Landlord access required</h2>
          <Link to="/register" className="font-medium text-emerald-600 dark:text-emerald-400">Register as landlord</Link>
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <Link to={`/properties/${id}`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
            View listing
          </Link>
        </div>

        <div className={surfaceCard('p-0')}>
          <div className="page-header-bg rounded-t-[1.75rem] px-6 py-6 sm:px-8">
            <div className="eyebrow mb-3">Listing manager</div>
            <h1 className="mb-1 text-2xl font-bold text-slate-950 dark:text-white">Edit Property</h1>
            <p className="text-slate-600 dark:text-slate-400">Update your listing details and availability settings.</p>
          </div>

          {property && (
            <div className="mx-6 mt-6 flex flex-wrap gap-2 sm:mx-8">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${property.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : property.status === 'pending_verification' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {property.status.replace('_', ' ')}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${property.is_verified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {property.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          )}

          {property?.is_verified && (
            <div className={bannerStyles('warning', 'mx-6 mt-6 sm:mx-8')}>
              Changing listing details will send this property back to pending verification until an admin reviews it again.
            </div>
          )}

          {error && (
            <div className={bannerStyles('error', 'mx-6 mt-6 sm:mx-8')}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && !error && (
            <div className={bannerStyles('success', 'mx-6 mt-6 sm:mx-8')}>
              <CheckCircle className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input type="text" value={form.title} onChange={set('title')} className={inputStyles()} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className={inputStyles('resize-none')} required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <input type="number" min="0" value={form.rent_amount} onChange={set('rent_amount')} className={inputStyles()} required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Listing Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  disabled={!property?.is_verified}
                  className={inputStyles('disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600')}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
                {!property?.is_verified && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">This listing can only be activated after verification.</p>
                )}
              </div>

              <div className="flex items-center pt-8">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                  <input
                    type="checkbox"
                    checked={form.furnished}
                    onChange={set('furnished')}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Furnished</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={buttonStyles({ fullWidth: true })}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
