import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Maximize2, Shield, Star, Zap, Droplets, Bolt, Car, Lock, Phone, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { properties as propApi, rentals } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unlocked, setUnlocked] = useState(null)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    propApi.get(id).then(setProperty).catch(() => setError('Property not found')).finally(() => setLoading(false))
  }, [id])

  const handleUnlock = async () => {
    setUnlocking(true)
    setError('')
    try {
      const data = await rentals.unlock({ property_id: Number(id) })
      setUnlocked(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Property not found</h2>
        <Link to="/properties" className="text-emerald-600 mt-2 inline-block">Back to listings</Link>
      </div>
    )
  }

  const amenities = [
    { label: 'Water', available: property.has_water, icon: Droplets },
    { label: 'Electricity', available: property.has_electricity, icon: Bolt },
    { label: 'Parking', available: property.has_parking, icon: Car },
    { label: 'Security', available: property.has_security, icon: Shield },
    { label: 'Furnished', available: property.furnished, icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/properties" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <span className="text-gray-400">Property Photos</span>
              <div className="absolute top-4 left-4 flex gap-2">
                {property.is_premium && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Premium
                  </span>
                )}
                {property.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.street}, {property.ward}, {property.district}</span>
              </div>

              <div className="flex flex-wrap gap-4 py-4 border-t border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Bed className="w-4 h-4" /> {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Bath className="w-4 h-4" /> {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
                </div>
                {property.size_sqm && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Maximize2 className="w-4 h-4" /> {property.size_sqm} sqm
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map(({ label, available, icon: Icon }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Monthly Rent</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-600">
                    TZS {property.rent_amount?.toLocaleString()}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                {property.deposit_amount && (
                  <div className="text-sm text-gray-500 mt-1">
                    Deposit: TZS {property.deposit_amount?.toLocaleString()}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {unlocked ? (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
                    <Lock className="w-4 h-4" /> Contact Unlocked
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">{unlocked.owner_phone}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Owner: {unlocked.owner_name}
                    </div>
                  </div>
                </div>
              ) : user ? (
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {unlocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {unlocking ? 'Unlocking...' : 'Unlock Contact — TZS 5,000'}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  Sign In to Contact Owner
                </Link>
              )}

              <p className="text-xs text-gray-400 mt-3 text-center">
                Pay once to get the landlord's direct contact info
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
