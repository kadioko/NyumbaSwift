import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Building, Users, CreditCard, TrendingUp, Plus, Loader2, ChevronRight, ShieldCheck, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react'
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

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

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
        ? {
            ...property,
            status: updatedProperty.status,
            rent_amount: updatedProperty.rent_amount,
            is_verified: updatedProperty.is_verified,
            is_premium: updatedProperty.is_premium,
          }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const stats = summary ? [
    { label: 'Total Properties', value: summary.total_properties, icon: Building, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Listings', value: summary.active_listings, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: isAdmin ? 'Active Rentals' : 'Active Tenants', value: summary.active_rentals, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: isAdmin ? 'Platform Revenue' : 'Rent Collected', value: `TZS ${(isAdmin ? summary.total_platform_revenue_tzs : summary.total_rent_collected_tzs)?.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
  ] : []

  const tabs = isAdmin ? ['overview', 'verifications'] : ['overview', 'properties']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-0.5">Welcome back, {user?.full_name}</p>
            </div>
            {!isAdmin && (
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Property
              </Link>
            )}
          </div>

          <div className="flex gap-1 mt-6 -mb-px">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadDashboard} className="font-medium text-red-700 hover:text-red-800">
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm border border-emerald-100">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!summary ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">Dashboard data is unavailable</h3>
            <p className="text-gray-500 mb-4">We couldn&apos;t load your latest dashboard information.</p>
            <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">
              <Loader2 className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : (
          <>
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon, color }) => {
                const Icon = icon
                return (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{label}</span>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{isAdmin ? 'Platform Summary' : 'Revenue Summary'}</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{isAdmin ? 'Rent Processed' : 'Total Rent Collected'}</div>
                  <div className="text-xl font-bold text-gray-900">TZS {(isAdmin ? summary.total_rent_processed_tzs : summary.total_rent_collected_tzs)?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{isAdmin ? 'Unlock Revenue' : 'Platform Fees Paid'}</div>
                  <div className="text-xl font-bold text-gray-900">TZS {(isAdmin ? summary.unlock_fees_revenue_tzs : summary.total_platform_fees_tzs)?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">{isAdmin ? 'Pending Verifications' : 'Pending Payments'}</div>
                  <div className="text-xl font-bold text-amber-600">{isAdmin ? pendingVerifications.length : summary.pending_payments}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAdmin && tab === 'properties' && (
          <div className="space-y-4">
            {properties.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">No properties yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first rental property</p>
                <Link to="/properties/new" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">
                  <Plus className="w-4 h-4" /> Add Property
                </Link>
              </div>
            ) : (
              properties.map((p) => (
                <div key={p.property_id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{p.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                        {p.is_verified && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Verified</span>}
                        {p.is_premium && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Premium</span>}
                      </div>
                      <div className="text-sm text-gray-500">{p.district} &middot; TZS {p.rent_amount?.toLocaleString()}/mo</div>
                      {p.current_tenant && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-semibold text-emerald-700">
                            {p.current_tenant.name?.charAt(0)}
                          </div>
                          <span className="text-gray-700">{p.current_tenant.name}</span>
                          <span className="text-gray-400">&middot; Since {new Date(p.current_tenant.rental_start).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          type="button"
                          disabled={propertyActionState.propertyId === p.property_id}
                          onClick={() => handlePropertyStatus(p)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {propertyActionState.propertyId === p.property_id && propertyActionState.action !== 'boost'
                            ? p.status === 'active' ? 'Updating...' : 'Activating...'
                            : p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          disabled={propertyActionState.propertyId === p.property_id || p.is_premium}
                          onClick={() => handleBoostProperty(p)}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {propertyActionState.propertyId === p.property_id && propertyActionState.action === 'boost'
                            ? 'Boosting...'
                            : p.is_premium ? 'Premium Active' : 'Boost Listing'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Link to={`/properties/${p.property_id}/edit`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                        Edit
                      </Link>
                      <Link to={`/properties/${p.property_id}`} className="text-gray-400 hover:text-emerald-600">
                        <ChevronRight className="w-5 h-5" />
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
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">No pending user verifications</h3>
                <p className="text-gray-500">New renter and user submissions will appear here for admin review.</p>
              </div>
            ) : (
              pendingVerifications.map((pendingUser) => (
                <div key={pendingUser.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-700">
                          {pendingUser.full_name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{pendingUser.full_name}</h3>
                          <div className="text-sm text-gray-500 capitalize">{pendingUser.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{pendingUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{pendingUser.email || 'No email provided'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        National ID: <span className="font-medium text-gray-800">{pendingUser.national_id || 'Not provided'}</span>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 border border-amber-100">
                        Awaiting admin review
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          disabled={reviewingState.userId === pendingUser.id}
                          onClick={() => handleReviewVerification(pendingUser.id, 'verified')}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {reviewingState.userId === pendingUser.id && reviewingState.action === 'verified' ? 'Verifying...' : 'Verify User'}
                        </button>
                        <button
                          type="button"
                          disabled={reviewingState.userId === pendingUser.id}
                          onClick={() => handleReviewVerification(pendingUser.id, 'rejected')}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          {reviewingState.userId === pendingUser.id && reviewingState.action === 'rejected' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                    <div className="lg:w-[320px]">
                      {pendingUser.profile_photo_url ? (
                        <img src={pendingUser.profile_photo_url} alt={`${pendingUser.full_name} ID`} className="w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                      ) : (
                        <div className="h-full min-h-48 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
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
