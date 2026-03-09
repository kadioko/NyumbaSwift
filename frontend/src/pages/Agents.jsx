import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Star, MapPin, Shield, Loader2, ArrowRight } from 'lucide-react'
import { agents as agentApi } from '../services/api'

export default function Agents() {
  const [agentList, setAgentList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    agentApi.list()
      .then(setAgentList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-sm mb-3">
                <Shield className="w-3.5 h-3.5" /> Verified by NyumbaSwift
              </div>
              <h1 className="text-3xl font-bold mb-2">Verified Agents</h1>
              <p className="text-emerald-100 max-w-lg">
                Trusted real estate professionals who know Dar's market inside-out. Every agent is vetted and verified.
              </p>
            </div>
            <Link
              to="/agents/apply"
              className="hidden sm:inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              Become an Agent <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : agentList.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No agents yet</h3>
            <p className="text-gray-500 mb-6">Be the first verified agent in Dar</p>
            <Link
              to="/agents/apply"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentList.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-xl font-bold text-emerald-700 shrink-0">
                    {agent.business_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{agent.business_name || `Agent #${agent.id}`}</h3>
                    {agent.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm text-gray-600">{agent.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                </div>

                {agent.bio && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{agent.bio}</p>
                )}

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{agent.operating_districts.replace(/,/g, ', ')}</span>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  <span>{agent.total_listings} listings</span>
                  <span>{agent.total_rentals_facilitated} rentals</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            to="/agents/apply"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Become an Agent <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
