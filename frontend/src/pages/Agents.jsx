import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Star, MapPin, Shield, Loader2, ArrowRight, BadgeCheck, BriefcaseBusiness } from 'lucide-react'
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
    <div className="min-h-screen">
      <section className="px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div className="shell-panel relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-12 text-white sm:px-8 lg:px-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-emerald-300 blur-3xl" />
            <div className="absolute right-10 top-0 h-64 w-64 rounded-full bg-amber-300 blur-3xl" />
          </div>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-slate-950/28 px-4 py-1.5 text-sm font-semibold text-white">
                <Shield className="w-3.5 h-3.5 text-emerald-300" /> Verified by NyumbaSwift
              </div>
              <h1 className="mb-3 max-w-3xl text-4xl font-bold sm:text-5xl">Meet agents renters can trust.</h1>
              <p className="max-w-2xl text-lg leading-relaxed text-emerald-50/85">
                Trusted real estate professionals who know Dar&apos;s market inside-out. Every agent is vetted, reviewed, and connected to cleaner rental workflows.
              </p>
            </div>
            <Link
              to="/agents/apply"
              className="hero-primary-cta hidden items-center justify-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-300 px-5 py-3 font-semibold text-slate-950 shadow-[0_18px_36px_rgba(8,17,13,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-amber-200 sm:inline-flex"
            >
              Become an Agent <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['Verified profiles', 'Identity and application review before approval', BadgeCheck],
              ['Local coverage', 'District knowledge across Dar es Salaam', MapPin],
              ['Cleaner deals', 'Better trust signals for renters and landlords', BriefcaseBusiness],
            ].map(([title, desc, Icon]) => (
              <div key={title} className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                <Icon className="mb-3 h-5 w-5 text-emerald-300" />
                <div className="font-semibold">{title}</div>
                <p className="mt-1 text-sm leading-relaxed text-emerald-50/72">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="shell-card flex items-center justify-center rounded-[1.75rem] py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin dark:text-emerald-400" />
          </div>
        ) : agentList.length === 0 ? (
          <div className="shell-card rounded-[1.75rem] px-6 py-20 text-center">
            <Users className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">No agents yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first verified agent in Dar</p>
            <Link
              to="/agents/apply"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentList.map((agent) => (
              <div key={agent.id} className="shell-card rounded-[1.6rem] p-6 transition-all hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-700">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-xl font-bold text-emerald-700 shrink-0 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {agent.business_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate dark:text-white">{agent.business_name || `Agent #${agent.id}`}</h3>
                    {agent.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{agent.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                </div>

                {agent.bio && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{agent.bio}</p>
                )}

                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{agent.operating_districts.replace(/,/g, ', ')}</span>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white"
          >
            Become an Agent <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
