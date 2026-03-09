import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { properties as propApi } from '../services/api'
import PropertyCard from '../components/PropertyCard'

const DISTRICTS = ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni']
const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'commercial', label: 'Commercial' },
]

export default function Properties() {
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    district: '', property_type: '', min_rent: '', max_rent: '', bedrooms: '', page: 1,
  })

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const data = await propApi.list(filters)
      setListings(data.properties)
      setTotal(data.total)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [filters.page])

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
    fetchProperties()
  }

  const clearFilters = () => {
    const reset = { district: '', property_type: '', min_rent: '', max_rent: '', bedrooms: '', page: 1 }
    setFilters(reset)
    setTimeout(fetchProperties, 0)
  }

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })

  const hasFilters = filters.district || filters.property_type || filters.min_rent || filters.max_rent || filters.bedrooms

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Find Your Next Home</h1>
          <p className="text-gray-500">Browse verified rental listings across Dar es Salaam</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filters.district}
              onChange={set('district')}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">All Districts</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select value={filters.property_type} onChange={set('property_type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  {TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rent (TZS)</label>
                <input type="number" placeholder="e.g. 200000" value={filters.min_rent} onChange={set('min_rent')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Rent (TZS)</label>
                <input type="number" placeholder="e.g. 1000000" value={filters.max_rent} onChange={set('max_rent')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <select value={filters.bedrooms} onChange={set('bedrooms')} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{total} {total === 1 ? 'property' : 'properties'} found</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No properties found</h3>
            <p className="text-gray-500">Try adjusting your filters or search in a different district</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {filters.page} of {Math.ceil(total / 20)}
                </span>
                <button
                  disabled={filters.page >= Math.ceil(total / 20)}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
