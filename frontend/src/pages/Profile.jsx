import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { auth as authApi } from '../services/api'
import { User, Phone, Mail, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [nationalId, setNationalId] = useState('')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await authApi.updateMe(form)
      setUser(updated)
      setEditing(false)
      setSuccess('Profile updated')
      setTimeout(() => setSuccess(''), 3000)
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
      const updated = await authApi.verify({ national_id: nationalId })
      setUser(updated)
      setNationalId('')
      setSuccess('Verification submitted')
      setTimeout(() => setSuccess(''), 3000)
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

        {/* Profile card */}
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
              {user.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
              )}
              <button onClick={() => setEditing(true)} className="mt-4 text-emerald-600 text-sm font-medium hover:text-emerald-700">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Verification */}
        {user.verification_status === 'unverified' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Verify Your Identity</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Submit your national ID to get verified. Verified users get priority access and more trust from landlords.
            </p>
            <form onSubmit={handleVerify} className="flex gap-3">
              <input
                type="text"
                placeholder="National ID number"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
              <button type="submit" disabled={verifying} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
