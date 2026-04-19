import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X, Loader2, Building2, Sparkles, ArrowDownUp, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { properties as propApi } from '../services/api'
import PropertyCard from '../components/PropertyCard'
import { buttonStyles, skeletonBlock } from '../components/ui'

const DISTRICTS = ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni']
const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'commercial', label: 'Commercial' },
]

const FEATURE_CHIPS = ['Verified only', 'Move-in ready', 'Family homes', 'Near business hubs']
const SAVED_SEARCHES_KEY = 'nyumbaswift_saved_searches'
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'rent_asc', label: 'Rent: Low to high' },
  { value: 'rent_desc', label: 'Rent: High to low' },
  { value: 'bedrooms_desc', label: 'Most bedrooms' },
]

export default function Properties() {
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [savedSearches, setSavedSearches] = useState([])
  const [savedNotice, setSavedNotice] = useState('')
  const [filters, setFilters] = useState({
    district: '',
    property_type: '',
    min_rent: '',
    max_rent: '',
    bedrooms: '',
    page: 1,
  })

  const fetchProperties = async (params = filters) => {
    setLoading(true)
    setSavedNotice('')
    try {
      const data = await propApi.list(params)
      setListings(data.properties)
      setTotal(data.total)
    } catch {
      setListings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [filters.page])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_SEARCHES_KEY)
      if (stored) {
        setSavedSearches(JSON.parse(stored))
      }
    } catch {
      setSavedSearches([])
    }
  }, [])

  useEffect(() => {
    if (!savedNotice) return undefined
    const timeoutId = window.setTimeout(() => setSavedNotice(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [savedNotice])

  const handleSearch = (e) => {
    e.preventDefault()
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    fetchProperties(nextFilters)
  }

  const clearFilters = () => {
    const reset = { district: '', property_type: '', min_rent: '', max_rent: '', bedrooms: '', page: 1 }
    setFilters(reset)
    fetchProperties(reset)
  }

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value })

  const hasFilters = filters.district || filters.property_type || filters.min_rent || filters.max_rent || filters.bedrooms
  const activeFilterSummary = [
    filters.district,
    filters.property_type,
    filters.min_rent ? `min ${Number(filters.min_rent).toLocaleString()}` : '',
    filters.max_rent ? `max ${Number(filters.max_rent).toLocaleString()}` : '',
    filters.bedrooms ? `${filters.bedrooms}+ beds` : '',
  ].filter(Boolean)

  const isCurrentSearchSaved = savedSearches.some((search) => JSON.stringify(search.filters) === JSON.stringify(filters))

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'rent_asc') return (a.rent_amount || 0) - (b.rent_amount || 0)
    if (sortBy === 'rent_desc') return (b.rent_amount || 0) - (a.rent_amount || 0)
    if (sortBy === 'bedrooms_desc') return (b.bedrooms || 0) - (a.bedrooms || 0)

    const featuredScore = (property) => (property.is_premium ? 2 : 0) + (property.is_verified ? 1 : 0)
    return featuredScore(b) - featuredScore(a)
  })

  const persistSavedSearches = (nextSearches) => {
    setSavedSearches(nextSearches)
    window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(nextSearches))
  }

  const saveCurrentSearch = () => {
    const labelParts = activeFilterSummary.length ? activeFilterSummary : ['All rentals']
    const nextSearch = {
      id: `${Date.now()}`,
      label: labelParts.join(' • '),
      filters,
    }
    const deduped = savedSearches.filter((search) => JSON.stringify(search.filters) !== JSON.stringify(filters))
    persistSavedSearches([nextSearch, ...deduped].slice(0, 6))
    setSavedNotice('Search saved for later.')
  }

  const applySavedSearch = (savedSearch) => {
    const nextFilters = { ...savedSearch.filters, page: 1 }
    setFilters(nextFilters)
    setSavedNotice(`Loaded "${savedSearch.label}".`)
    fetchProperties(nextFilters)
  }

  return (
    <div className="min-h-screen">
      <section className="px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div className="shell-card mx-auto max-w-7xl rounded-[2rem] overflow-hidden">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_top_left,_rgba(15,127,95,0.13),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(211,154,52,0.12),_transparent_22%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(241,247,242,0.94))] px-6 py-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="eyebrow mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Marketplace
              </span>
              <h1 className="mb-3 max-w-3xl text-4xl font-bold text-slate-950 sm:text-5xl">Find homes with stronger trust signals.</h1>
              <p className="max-w-2xl text-slate-600">
                Browse verified rental listings across Dar es Salaam with clearer pricing, better screening cues, and faster access to serious opportunities.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/80 bg-white/86 px-5 py-4 shadow-sm">
              <div className="text-sm text-slate-500">Live inventory</div>
              <div className="text-3xl font-bold text-slate-950">{total}</div>
              <div className="text-sm text-emerald-700">properties currently matching your search</div>
            </div>
          </div>

          <div className="border-t border-slate-200/70 px-6 py-4 sm:px-8">
            <div className="flex flex-wrap gap-2">
              {FEATURE_CHIPS.map((chip) => (
                <span key={chip} className="rounded-full border border-slate-200 bg-white/82 px-3 py-1.5 text-sm text-slate-600">
                  {chip}
                </span>
              ))}
            </div>
            {savedSearches.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-slate-500">Saved searches</div>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((search) => (
                    <button
                      key={search.id}
                      type="button"
                      onClick={() => applySavedSearch(search)}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      {search.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="shell-card mb-6 rounded-[1.75rem] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.district}
                onChange={set('district')}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All Districts</option>
                {DISTRICTS.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-medium transition-colors ${
                showFilters
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            <button
              type="submit"
              className={buttonStyles({ className: 'px-6' })}
            >
              Search Listings
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 rounded-[1.4rem] border border-slate-100 bg-white/86 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Property Type</label>
                  <select value={filters.property_type} onChange={set('property_type')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100">
                    {TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Min Rent (TZS)</label>
                  <input type="number" placeholder="200000" value={filters.min_rent} onChange={set('min_rent')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Max Rent (TZS)</label>
                  <input type="number" placeholder="1000000" value={filters.max_rent} onChange={set('max_rent')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Bedrooms</label>
                  <select value={filters.bedrooms} onChange={set('bedrooms')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100">
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>{count}+</option>
                    ))}
                  </select>
                </div>
              </div>

              {hasFilters && (
                <button type="button" onClick={clearFilters} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </form>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="text-sm text-slate-500">
              {total} {total === 1 ? 'property' : 'properties'} found
            </div>
            {activeFilterSummary.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilterSummary.map((item) => (
                  <span key={item} className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            )}
            {savedNotice && <div className="text-sm text-emerald-700">{savedNotice}</div>}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowDownUp className="h-4 w-4" />
              Sort by
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveCurrentSearch}
                disabled={isCurrentSearchSaved}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isCurrentSearchSaved ? <BookmarkCheck className="h-4 w-4 text-emerald-700" /> : <BookmarkPlus className="h-4 w-4" />}
                {isCurrentSearchSaved ? 'Saved' : 'Save search'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/88 p-0 shadow-[0_18px_40px_rgba(17,36,25,0.08)]">
                <div className={skeletonBlock('h-56 rounded-none')} />
                <div className="space-y-4 p-5">
                  <div className={skeletonBlock('h-6 w-3/4')} />
                  <div className={skeletonBlock('h-4 w-1/2')} />
                  <div className="flex gap-2">
                    <div className={skeletonBlock('h-8 w-20 rounded-full')} />
                    <div className={skeletonBlock('h-8 w-20 rounded-full')} />
                  </div>
                  <div className={skeletonBlock('h-5 w-2/5')} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="shell-card rounded-[1.8rem] px-6 py-16 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-xl font-semibold text-slate-800">No properties found</h3>
            <p className="mx-auto max-w-md text-slate-500">
              Try adjusting your filters or search in a different district to widen the available inventory.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Clear filters
              </button>
              {savedSearches[0] && (
                <button type="button" onClick={() => applySavedSearch(savedSearches[0])} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  Try saved search
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedListings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {total > 20 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {filters.page} of {Math.ceil(total / 20)}
                </span>
                <button
                  disabled={filters.page >= Math.ceil(total / 20)}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 hover:bg-slate-50"
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
