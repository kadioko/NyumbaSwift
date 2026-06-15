import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Shield, Star, Zap, ArrowUpRight, Building2 } from 'lucide-react'

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  room: 'Room',
  commercial: 'Commercial',
}

export default function PropertyCard({ property }) {
  const {
    id, title, district, ward, property_type, rent_amount,
    bedrooms, bathrooms, is_verified, is_premium, furnished, photos,
  } = property
  const primaryPhoto = photos?.find((photo) => photo.is_primary)?.photo_url || photos?.[0]?.photo_url

  return (
    <Link to={`/properties/${id}`} className="group block">
      <div className={`overflow-hidden rounded-[1.6rem] border bg-white/88 shadow-[0_18px_40px_rgba(17,36,25,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_52px_rgba(17,36,25,0.14)] dark:bg-slate-900/86 dark:shadow-[0_22px_48px_rgba(0,0,0,0.34)] ${is_premium ? 'border-amber-200 ring-1 ring-amber-200/70 dark:border-amber-700/70 dark:ring-amber-700/50' : 'border-white/70 dark:border-white/8'}`}>
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-50 via-stone-100 to-emerald-100 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Building2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
              Property preview coming soon
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-1.5">
            {is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-sm">
                <Star className="w-3 h-3" /> Premium
              </span>
            )}
            {is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur dark:bg-slate-950/82 dark:text-slate-100">
              {TYPE_LABELS[property_type] || property_type}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-slate-950/82 dark:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-semibold text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
              {title}
            </h3>
          </div>

          <div className="mb-4 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{ward}, {district}</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              <Bed className="w-3.5 h-3.5" /> {bedrooms} bed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              <Bath className="w-3.5 h-3.5" /> {bathrooms} bath
            </span>
            {furnished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Zap className="w-3.5 h-3.5" /> Furnished
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                TZS {rent_amount?.toLocaleString()}
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500">/month</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">View</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Safer discovery with clearer trust and pricing signals.
          </div>
        </div>
      </div>
    </Link>
  )
}
