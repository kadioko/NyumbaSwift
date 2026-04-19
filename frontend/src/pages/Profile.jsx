import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { auth as authApi } from '../services/api'
import { Phone, Mail, Shield, AlertCircle, CheckCircle, Loader2, Image as ImageIcon, UserRound, BadgeCheck } from 'lucide-react'
import { bannerStyles, buttonStyles, inputStyles, surfaceCard } from '../components/ui'

const MAX_ID_IMAGE_BYTES = 5 * 1024 * 1024

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
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for your National ID.')
      return
    }
    if (file.size > MAX_ID_IMAGE_BYTES) {
      setError('National ID image must be 5MB or smaller.')
      return
    }
    setError('')
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
    unverified: 'bg-slate-100 text-slate-600',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl space-y-6 px-4">
        {error && (
          <div className={bannerStyles('error')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className={bannerStyles('success')}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <div className={surfaceCard('overflow-hidden')}>
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,127,95,0.15),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(240,247,241,0.94))] -m-6 mb-6 px-6 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                  {user.full_name?.charAt(0)}
                </div>
                <div>
                  <div className="eyebrow mb-2">Profile</div>
                  <h2 className="text-2xl font-bold text-slate-950">{user.full_name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm capitalize text-slate-500">{user.role}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${verificationColor[user.verification_status]}`}>
                      {user.verification_status}
                    </span>
                  </div>
                </div>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} className={buttonStyles({ variant: 'secondary' })}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={inputStyles()}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputStyles()}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className={buttonStyles()}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className={buttonStyles({ variant: 'secondary' })}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Phone
                  </div>
                  <div className="text-slate-800">{user.phone}</div>
                </div>
                <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email
                  </div>
                  <div className="text-slate-800">{user.email || 'No email added yet'}</div>
                </div>
              </div>
              {user.national_id && (
                <div className="text-sm text-slate-500">
                  National ID: <span className="font-medium text-slate-700">{user.national_id}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {(user.verification_status === 'unverified' || user.verification_status === 'rejected') && (
          <div className={surfaceCard()}>
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-950">Verify Your Identity</h3>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Add your email, national ID number, and upload an ID image so admins can review and verify your account.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              {!user.email && (
                <div className={bannerStyles('warning')}>
                  Add your email address in the profile section above before submitting verification or unlocking contact details.
                </div>
              )}
              <input
                type="text"
                placeholder="National ID number"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className={inputStyles()}
                required
              />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700">
                <ImageIcon className="h-4 w-4" />
                <span>{idImage ? 'Replace National ID image' : 'Upload National ID image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleIdImageChange} />
              </label>
              {idImage && (
                <img src={idImage} alt="National ID preview" className="max-h-64 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 object-contain" />
              )}
              <button type="submit" disabled={verifying || !user.email || !idImage} className={buttonStyles()}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Verification'}
              </button>
            </form>
          </div>
        )}

        {user.verification_status === 'pending' && (
          <div className={surfaceCard()}>
            <div className="mb-3 flex items-center gap-3 text-amber-800">
              <BadgeCheck className="h-5 w-5" />
              <h3 className="font-semibold">Verification Pending Review</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Your National ID details have been submitted. An admin will review them and verify your account once everything checks out.
            </p>
            {user.profile_photo_url && (
              <img src={user.profile_photo_url} alt="Submitted National ID" className="max-h-64 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 object-contain" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
