import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, Users, CreditCard, TrendingUp, Plus, Loader2, AlertCircle, ChevronRight } from 'lucide-react'
import { dashboard as dashApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    Promise.all([dashApi.landlordSummary(), dashApi.landlordProperties()])
      .then(([s, p]) => { setSummary(s); setProperties(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    { label: 'Active Tenants', value: summary.active_rentals, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Rent Collected', value: `TZS ${summary.total_rent_collected_tzs?.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-0.5">Welcome back, {user?.full_name}</p>
            </div>
            <Link
              to="/properties/new"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </Link>
          </div>

          <div className="flex gap-1 mt-6 -mb-px">
            {['overview', 'properties'].map((t) => (
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
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Revenue summary */}
            {summary && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue Summary</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total Rent Collected</div>
                    <div className="text-xl font-bold text-gray-900">TZS {summary.total_rent_collected_tzs?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Platform Fees Paid</div>
                    <div className="text-xl font-bold text-gray-900">TZS {summary.total_platform_fees_tzs?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pending Payments</div>
                    <div className="text-xl font-bold text-amber-600">{summary.pending_payments}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'properties' && (
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
                    </div>
                    <Link to={`/properties/${p.property_id}`} className="text-gray-400 hover:text-emerald-600">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
