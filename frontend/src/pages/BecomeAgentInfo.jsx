import { BadgeCheck, Briefcase, MapPinned, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BecomeAgentInfo() {
  return (
    <div className="min-h-screen">
      <section className="page-header-bg border-b border-slate-200/70 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <BadgeCheck className="h-4 w-4" />
            <span>Become an Agent</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-slate-950 dark:text-white">Grow your brokerage with NyumbaSwift</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Join as a verified agent to showcase your expertise, work with quality listings, and build trust with renters and landlords across Dar es Salaam.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Briefcase,
              title: 'Professional presence',
              description: 'Get a structured agent profile with business details, operating districts, and approval status.'
            },
            {
              icon: MapPinned,
              title: 'Local reach',
              description: 'Highlight the neighborhoods you know best and connect with renters searching there.'
            },
            {
              icon: BadgeCheck,
              title: 'Verification advantage',
              description: 'Stand out with a verified agent workflow that adds credibility to every introduction.'
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
          <h2 className="mb-4 text-2xl font-bold text-slate-950 dark:text-white">What you need to apply</h2>
          <div className="grid gap-6 leading-8 text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <div>
              <p>A complete agent or broker profile</p>
              <p>Business or license information where available</p>
              <p>Clear operating districts</p>
            </div>
            <div>
              <p>A strong professional bio</p>
              <p>Commitment to verified, trustworthy listings</p>
              <p>Responsive communication with clients</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-emerald-600 p-8 text-white shadow-[0_22px_55px_rgba(15,118,110,0.24)] dark:bg-emerald-700 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Start your agent application</h2>
            <p className="text-emerald-100">Submit your details and join the verified network.</p>
          </div>
          <Link to="/agents/apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-50">
            Apply Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
