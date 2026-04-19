import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Shield,
  Star,
  Zap,
  Droplets,
  Bolt,
  Car,
  Lock,
  Phone,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  BadgeCheck,
} from 'lucide-react'
import { properties as propApi, rentals } from '../services/api'
import { useAuth } from '../context/useAuth'
import { bannerStyles, buttonStyles, surfaceCard } from '../components/ui'

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState('')
  const [loading, setLoading] = useState(true)
  const [unlockStatus, setUnlockStatus] = useState(null)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    propApi.get(id)
      .then((data) => {
        setProperty(data)
        const initialPhoto = data.photos?.find((photo) => photo.is_primary)?.photo_url || data.photos?.[0]?.photo_url || ''
        setSelectedPhoto(initialPhoto)
      })
      .catch(() => setError('Property not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleUnlock = async () => {
    setUnlocking(true)
    setError('')
    setSuccess('')
    try {
      const data = await rentals.unlock({ property_id: Number(id) })
      setUnlockStatus(data)
      setSuccess(data?.message || 'Unlock request started. Complete the payment prompt on your phone.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUnlocking(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setUnlockStatus(null)
      return
    }

    rentals.unlockStatus(Number(id))
      .then(setUnlockStatus)
      .catch((err) => {
        if (!String(err.message).includes('Unlock not found')) {
          setError(err.message)
        }
      })
  }, [id, user])

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (unlockStatus?.payment_status === 'pending') {
        try {
          const data = await rentals.unlockStatus(Number(id))
          setUnlockStatus(data)
          if (data?.payment_status === 'completed') {
            setSuccess(data?.message || 'Contact unlocked successfully.')
          }
        } catch (err) {
          setError(err.message)
        }
      }
    }, 5000)
    return () => clearInterval(intervalId)
  }, [id, unlockStatus])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-700">Property not found</h2>
        <Link to="/properties" className="mt-2 inline-block text-emerald-700">Back to listings</Link>
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

  const photos = property.photos || []
  const heroPhoto = selectedPhoto || photos.find((photo) => photo.is_primary)?.photo_url || photos[0]?.photo_url
  const isUnlocked = unlockStatus?.payment_status === 'completed' && unlockStatus?.owner_phone
  const isPendingUnlock = unlockStatus?.payment_status === 'pending'

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/properties" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="shell-card overflow-hidden rounded-[2rem]">
              <div className="relative h-72 overflow-hidden bg-gradient-to-br from-emerald-50 via-stone-100 to-emerald-100 sm:h-96">
                {heroPhoto ? (
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">Property Photos</div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/55 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {property.is_premium && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Star className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                  {property.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Shield className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(photo.photo_url)}
                    className={`overflow-hidden rounded-[1.2rem] border-2 transition-all ${selectedPhoto === photo.photo_url ? 'border-emerald-500 shadow-sm' : 'border-transparent hover:border-emerald-200'}`}
                  >
                    <img
                      src={photo.photo_url}
                      alt={property.title}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className={surfaceCard()}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow mb-3">
                    <Sparkles className="h-3.5 w-3.5" />
                    Verified marketplace listing
                  </div>
                  <h1 className="mb-2 text-3xl font-bold text-slate-950">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>{property.street}, {property.ward}, {property.district}</span>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
                  <div className="text-sm text-emerald-700">Monthly rent</div>
                  <div className="text-2xl font-bold text-emerald-800">TZS {property.rent_amount?.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-slate-700">
                  <Bed className="h-4 w-4 text-emerald-700" />
                  {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-slate-700">
                  <Bath className="h-4 w-4 text-emerald-700" />
                  {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-slate-700">
                  <Maximize2 className="h-4 w-4 text-emerald-700" />
                  {property.size_sqm ? `${property.size_sqm} sqm` : 'Size not listed'}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="mb-2 text-lg font-semibold text-slate-950">Description</h3>
                <p className="leading-relaxed text-slate-600">{property.description}</p>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-950">Amenities</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {amenities.map(({ label, available, icon }) => {
                    const Icon = icon
                    return (
                      <div
                        key={label}
                        className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${
                          available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={surfaceCard('sticky top-24')}>
              <div className="mb-5">
                <div className="mb-1 text-sm text-slate-500">Monthly Rent</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-700">TZS {property.rent_amount?.toLocaleString()}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                {property.deposit_amount && (
                  <div className="mt-1 text-sm text-slate-500">
                    Deposit: TZS {property.deposit_amount?.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mb-5 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <BadgeCheck className="h-4 w-4 text-emerald-700" />
                  Trust signals
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div>{property.is_verified ? 'Verified listing reviewed by the marketplace team.' : 'Listing verification still in progress.'}</div>
                  <div>{property.is_premium ? 'Premium placement means stronger visibility and fresher landlord response.' : 'Standard listing with direct unlock flow.'}</div>
                </div>
              </div>

              {error && (
                <div className={bannerStyles('error', 'mb-4')}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && !error && (
                <div className={bannerStyles('success', 'mb-4')}>
                  {success}
                </div>
              )}

              {unlockStatus?.message && !error && (
                <div className={`${bannerStyles(isPendingUnlock ? 'warning' : 'success', 'mb-4')}`}>
                  {unlockStatus.message}
                </div>
              )}

              {isUnlocked ? (
                <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
                    <Lock className="h-4 w-4" />
                    Contact Unlocked
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{unlockStatus.owner_phone}</span>
                    </div>
                    <div className="text-sm text-slate-600">Owner: {unlockStatus.owner_name}</div>
                  </div>
                </div>
              ) : isPendingUnlock ? (
                <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Payment Pending
                  </div>
                  <p className="text-sm leading-relaxed text-amber-700">
                    Approve the mobile money prompt on your phone. This page checks automatically and will reveal the landlord contact once Snippe confirms the payment.
                  </p>
                </div>
              ) : user ? (
                <button onClick={handleUnlock} disabled={unlocking} className={buttonStyles({ fullWidth: true })}>
                  {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {unlocking ? 'Unlocking...' : 'Unlock Contact — TZS 5,000'}
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: `/properties/${id}` } }}
                  className={buttonStyles({ fullWidth: true })}
                >
                  Sign In to Contact Owner
                </Link>
              )}

              <p className="mt-3 text-center text-xs text-slate-400">
                Pay once to get the landlord&apos;s direct contact information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
