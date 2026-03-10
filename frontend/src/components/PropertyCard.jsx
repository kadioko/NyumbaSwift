import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Shield, Star, Zap } from 'lucide-react'

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
      <div className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg ${is_premium ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'}`}>
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Property Photo</div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {is_premium && (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" /> Premium
              </span>
            )}
            {is_verified && (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {TYPE_LABELS[property_type] || property_type}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{ward}, {district}</span>
          </div>

          <div className="flex items-center gap-4 text-gray-500 text-sm mb-3">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" /> {bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {bathrooms} bath
            </span>
            {furnished && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Zap className="w-3.5 h-3.5" /> Furnished
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 pt-3 border-t border-gray-100">
            <span className="text-lg font-bold text-emerald-600">
              TZS {rent_amount?.toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm">/month</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
