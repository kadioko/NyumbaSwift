import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { auth as authApi } from '../services/api'
import { Phone, Mail, Shield, AlertCircle, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [nationalId, setNationalId] = useState(user?.national_id || '')
  const [idImage, setIdImage] = useState(user?.profile_photo_url || '')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setForm({ full_name: user?.full_name || '', email: user?.email || '' })
    setNationalId(user?.national_id || '')
    setIdImage(user?.profile_photo_url || '')
  }, [user])

  useEffect(() => {
    if (!success) return undefined
    const timeoutId = window.setTimeout(() => setSuccess(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [success])

  const handleIdImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setIdImage(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await authApi.updateMe(form)
      setUser(updated)
      setEditing(false)
      setSuccess('Profile updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setVerifying(true)
    setError('')
    try {
      const updated = await authApi.verify({ national_id: nationalId, profile_photo_url: idImage })
      setUser(updated)
      setSuccess('Verification submitted')
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  if (!user) return null

  const verificationColor = {
    verified: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    unverified: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-700">
              {user.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${verificationColor[user.verification_status]}`}>
                  {user.verification_status}
                </span>
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email || 'No email added yet'}</span>
              </div>
              {user.national_id && (
                <div className="text-sm text-gray-500">
                  National ID: <span className="font-medium text-gray-700">{user.national_id}</span>
                </div>
              )}
              <button onClick={() => setEditing(true)} className="mt-4 text-emerald-600 text-sm font-medium hover:text-emerald-700">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {(user.verification_status === 'unverified' || user.verification_status === 'rejected') && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Verify Your Identity</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add your email, national ID number, and upload an ID image so admins can review and verify your account.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              {!user.email && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  Add your email address in the profile section above before submitting verification or unlocking contact details.
                </div>
              )}
              <input
                type="text"
                placeholder="National ID number"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
              <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-6 text-sm text-gray-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                <span>{idImage ? 'Replace National ID image' : 'Upload National ID image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleIdImageChange} />
              </label>
              {idImage && (
                <img src={idImage} alt="National ID preview" className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
              )}
              <button type="submit" disabled={verifying || !user.email || !idImage} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Verification'}
              </button>
            </form>
          </div>
        )}

        {user.verification_status === 'pending' && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-3 text-amber-800">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Verification Pending Review</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your National ID details have been submitted. An admin will review them and verify your account once everything checks out.
            </p>
            {user.profile_photo_url && (
              <img src={user.profile_photo_url} alt="Submitted National ID" className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
