import { BadgeCheck, Briefcase, MapPinned, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BecomeAgentInfo() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-2 text-sm mb-6">
            <BadgeCheck className="w-4 h-4" />
            <span>Become an Agent</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Grow your brokerage with NyumbaSwift</h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            Join as a verified agent to showcase your expertise, work with quality listings, and build trust with renters and landlords across Dar es Salaam.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
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
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-emerald-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What you need to apply</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600 leading-8">
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

        <div className="bg-emerald-600 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Start your agent application</h2>
            <p className="text-emerald-100">Submit your details and join the verified network.</p>
          </div>
          <Link to="/agents/apply" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors">
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
