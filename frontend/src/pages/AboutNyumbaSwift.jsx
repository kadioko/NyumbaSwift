import { Building, ShieldCheck, CreditCard, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutNyumbaSwift() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Building className="h-4 w-4 text-emerald-300" />
            <span>About NyumbaSwift</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">Built for Dar es Salaam rentals</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-emerald-100">
            NyumbaSwift is a verified rental marketplace helping renters, landlords, and agents connect with more trust, better transparency, and digital rent workflows that fit the local market.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: 'Verified listings',
              description: 'We focus on quality listings, clearer property details, and better trust signals for renters.'
            },
            {
              icon: CreditCard,
              title: 'Digital rent collection',
              description: 'Landlords and tenants can manage rental payments more clearly through digital workflows.'
            },
            {
              icon: Users,
              title: 'Trusted agents',
              description: 'Agents can build credibility, get approved, and support deals with better visibility.'
            }
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="shell-card rounded-[1.5rem] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Icon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          ))}
        </div>

        <div className="shell-card rounded-[1.75rem] p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950 dark:text-white">Our mission</h2>
          <p className="mb-4 leading-8 text-slate-600 dark:text-slate-300">
            We want renting in Dar to feel safer, faster, and easier to manage. That means improving listing trust, reducing friction between renters and landlords, and giving agents a structured platform to operate professionally.
          </p>
          <p className="leading-8 text-slate-600 dark:text-slate-300">
            NyumbaSwift is designed to support the real rental journey: discovery, verification, contact unlocks, tenancy management, and payment tracking in one place.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-8 dark:border-emerald-800 dark:bg-emerald-900/20 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white">Ready to explore the platform?</h2>
            <p className="text-slate-600 dark:text-slate-300">Browse available rentals or apply to join the verified agent network.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/properties" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700">
              Browse Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/become-an-agent" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-900/30">
              Become an Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
