import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building,
  Users,
  CreditCard,
  TrendingUp,
  Plus,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { auth as authApi, dashboard as dashApi, properties as propApi } from '../services/api'
import { useAuth } from '../context/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [summary, setSummary] = useState(null)
  const [properties, setProperties] = useState([])
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [reviewingState, setReviewingState] = useState({ userId: null, action: '' })
  const [propertyActionState, setPropertyActionState] = useState({ propertyId: null, action: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const [stats, pending] = await Promise.all([dashApi.platformStats(), authApi.pendingVerifications()])
        setSummary(stats)
        setPendingVerifications(pending)
        setProperties([])
      } else {
        const [stats, landlordProperties] = await Promise.all([dashApi.landlordSummary(), dashApi.landlordProperties()])
        setSummary(stats)
        setProperties(landlordProperties)
        setPendingVerifications([])
      }
    } catch (err) {
      setSummary(null)
      setProperties([])
      setPendingVerifications([])
      setError(err.message || 'Unable to load dashboard right now.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (!success) return undefined
    const timeoutId = window.setTimeout(() => setSuccess(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [success])

  const handleReviewVerification = async (userId, verification_status) => {
    setReviewingState({ userId, action: verification_status })
    setError('')
    setSuccess('')
    try {
      const updated = await authApi.reviewVerification(userId, { verification_status })
      setPendingVerifications((current) => current.filter((item) => item.id !== updated.id))
      setSuccess(`${updated.full_name} was ${verification_status === 'verified' ? 'verified' : 'rejected'} successfully.`)
    } catch (err) {
      setError(err.message || `Unable to ${verification_status === 'verified' ? 'verify' : 'reject'} this user right now.`)
    } finally {
      setReviewingState({ userId: null, action: '' })
    }
  }

  const updatePropertyCard = (updatedProperty) => {
    setProperties((current) => current.map((property) => (
      property.property_id === updatedProperty.id
        ? { ...property, status: updatedProperty.status, rent_amount: updatedProperty.rent_amount, is_verified: updatedProperty.is_verified, is_premium: updatedProperty.is_premium }
        : property
    )))
  }

  const handlePropertyStatus = async (property) => {
    const nextStatus = property.status === 'active' ? 'inactive' : 'active'
    setPropertyActionState({ propertyId: property.property_id, action: nextStatus })
    setError('')
    setSuccess('')
    try {
      const updated = await propApi.update(property.property_id, { status: nextStatus })
      updatePropertyCard(updated)
      setSuccess(`${property.title} is now ${updated.status.replace('_', ' ')}.`)
    } catch (err) {
      setError(err.message || `Unable to update ${property.title} right now.`)
    } finally {
      setPropertyActionState({ propertyId: null, action: '' })
    }
  }

  const handleBoostProperty = async (property) => {
    setPropertyActionState({ propertyId: property.property_id, action: 'boost' })
    setError('')
    setSuccess('')
    try {
      const updated = await propApi.boost(property.property_id)
      updatePropertyCard(updated)
      setSuccess(`${property.title} was boosted successfully.`)
    } catch (err) {
      setError(err.message || `Unable to boost ${property.title} right now.`)
    } finally {
      setPropertyActionState({ propertyId: null, action: '' })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const stats = summary ? [
    { label: 'Total Properties', value: summary.total_properties, icon: Building, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active Listings', value: summary.active_listings, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: isAdmin ? 'Active Rentals' : 'Active Tenants', value: summary.active_rentals, icon: Users, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    { label: isAdmin ? 'Platform Revenue' : 'Rent Collected', value: `TZS ${(isAdmin ? summary.total_platform_revenue_tzs : summary.total_rent_collected_tzs)?.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  ] : []

  const tabs = isAdmin ? ['overview', 'verifications'] : ['overview', 'properties']

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-5 sm:px-6 lg:px-8">
        <div className="shell-card mx-auto max-w-7xl overflow-hidden rounded-[2rem]">
          <div className="page-header-bg px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="eyebrow mb-3">Control center</div>
                <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome back, {user?.full_name}</p>
              </div>
              {!isAdmin && (
                <Link
                  to="/properties/new"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 font-semibold text-white shadow-[0_16px_28px_rgba(15,127,95,0.22)] transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Property
                </Link>
              )}
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                    tab === t
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white/85 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadDashboard} className="font-medium text-red-700 hover:text-red-800 dark:text-red-300">
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!summary ? (
          <div className="shell-card rounded-[1.8rem] p-12 text-center">
            <Building className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mb-1 font-semibold text-slate-700 dark:text-slate-300">Dashboard data is unavailable</h3>
            <p className="mb-4 text-slate-500 dark:text-slate-400">We couldn&apos;t load your latest dashboard information.</p>
            <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
              <Loader2 className="h-4 w-4" />
              Try Again
            </button>
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map(({ label, value, icon, color }) => {
                    const Icon = icon
                    return (
                      <div key={label} className="shell-card rounded-[1.5rem] p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="shell-card rounded-[1.75rem] p-6">
                    <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">{isAdmin ? 'Platform Summary' : 'Revenue Summary'}</h3>
                    <div className="grid gap-6 sm:grid-cols-3">
                      <div>
                        <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">{isAdmin ? 'Rent Processed' : 'Total Rent Collected'}</div>
                        <div className="text-xl font-bold text-slate-950 dark:text-white">TZS {(isAdmin ? summary.total_rent_processed_tzs : summary.total_rent_collected_tzs)?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">{isAdmin ? 'Unlock Revenue' : 'Platform Fees Paid'}</div>
                        <div className="text-xl font-bold text-slate-950 dark:text-white">TZS {(isAdmin ? summary.unlock_fees_revenue_tzs : summary.total_platform_fees_tzs)?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">{isAdmin ? 'Pending Verifications' : 'Pending Payments'}</div>
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{isAdmin ? pendingVerifications.length : summary.pending_payments}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-6 text-white shadow-[0_28px_80px_rgba(8,17,13,0.28)]">
                    <div className="mb-2 text-sm uppercase tracking-[0.18em] text-emerald-200/70">Momentum</div>
                    <div className="mb-4 text-2xl font-bold">{isAdmin ? 'Platform health looks strong' : 'Your portfolio is moving'}</div>
                    <p className="text-sm leading-relaxed text-emerald-50/78">
                      {isAdmin
                        ? 'Use verification turnaround and rent processed totals to keep trust and platform liquidity improving together.'
                        : 'Prioritize premium boosts and active listing quality to keep occupancy high and rent collection predictable.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isAdmin && tab === 'properties' && (
              <div className="space-y-4">
                {properties.length === 0 ? (
                  <div className="shell-card rounded-[1.8rem] p-12 text-center">
                    <Building className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <h3 className="mb-1 font-semibold text-slate-700 dark:text-slate-300">No properties yet</h3>
                    <p className="mb-4 text-slate-500 dark:text-slate-400">Start by adding your first rental property.</p>
                    <Link to="/properties/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
                      <Plus className="h-4 w-4" />
                      Add Property
                    </Link>
                  </div>
                ) : (
                  properties.map((p) => (
                    <div key={p.property_id} className="shell-card rounded-[1.6rem] p-5 transition-colors hover:border-emerald-200 dark:hover:border-emerald-700">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-slate-950 dark:text-white">{p.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              p.status === 'pending_verification' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {p.status.replace('_', ' ')}
                            </span>
                            {p.is_verified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Verified</span>}
                            {p.is_premium && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Premium</span>}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{p.district} &middot; TZS {p.rent_amount?.toLocaleString()}/mo</div>
                          {p.current_tenant && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                {p.current_tenant.name?.charAt(0)}
                              </div>
                              <span className="text-slate-700 dark:text-slate-300">{p.current_tenant.name}</span>
                              <span className="text-slate-400 dark:text-slate-500">&middot; Since {new Date(p.current_tenant.rental_start).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={propertyActionState.propertyId === p.property_id}
                              onClick={() => handlePropertyStatus(p)}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {propertyActionState.propertyId === p.property_id && propertyActionState.action !== 'boost'
                                ? p.status === 'active' ? 'Updating...' : 'Activating...'
                                : p.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              disabled={propertyActionState.propertyId === p.property_id || p.is_premium}
                              onClick={() => handleBoostProperty(p)}
                              className="rounded-xl border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
                            >
                              {propertyActionState.propertyId === p.property_id && propertyActionState.action === 'boost'
                                ? 'Boosting...'
                                : p.is_premium ? 'Premium Active' : 'Boost Listing'}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 lg:ml-4">
                          <Link to={`/properties/${p.property_id}/edit`} className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                            Edit
                          </Link>
                          <Link to={`/properties/${p.property_id}`} className="rounded-full border border-slate-200 bg-white/85 p-2 text-slate-400 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-emerald-400">
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {isAdmin && tab === 'verifications' && (
              <div className="space-y-4">
                {pendingVerifications.length === 0 ? (
                  <div className="shell-card rounded-[1.8rem] p-12 text-center">
                    <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <h3 className="mb-1 font-semibold text-slate-700 dark:text-slate-300">No pending user verifications</h3>
                    <p className="text-slate-500 dark:text-slate-400">New renter and user submissions will appear here for admin review.</p>
                  </div>
                ) : (
                  pendingVerifications.map((pendingUser) => (
                    <div key={pendingUser.id} className="shell-card rounded-[1.8rem] p-6">
                      <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                              {pendingUser.full_name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-950 dark:text-white">{pendingUser.full_name}</h3>
                              <div className="text-sm capitalize text-slate-500 dark:text-slate-400">{pendingUser.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <span>{pendingUser.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <span>{pendingUser.email || 'No email provided'}</span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            National ID: <span className="font-medium text-slate-800 dark:text-slate-200">{pendingUser.national_id || 'Not provided'}</span>
                          </div>
                          <div className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            Awaiting admin review
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              disabled={reviewingState.userId === pendingUser.id}
                              onClick={() => handleReviewVerification(pendingUser.id, 'verified')}
                              className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {reviewingState.userId === pendingUser.id && reviewingState.action === 'verified' ? 'Verifying...' : 'Verify User'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingState.userId === pendingUser.id}
                              onClick={() => handleReviewVerification(pendingUser.id, 'rejected')}
                              className="rounded-xl border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              {reviewingState.userId === pendingUser.id && reviewingState.action === 'rejected' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                        <div className="lg:w-[320px]">
                          {pendingUser.profile_photo_url ? (
                            <img src={pendingUser.profile_photo_url} alt={`${pendingUser.full_name} ID`} className="max-h-80 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain dark:border-slate-700 dark:bg-slate-800" />
                          ) : (
                            <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                              No National ID image uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
