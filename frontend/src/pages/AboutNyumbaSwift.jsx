import { Building, ShieldCheck, CreditCard, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutNyumbaSwift() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm mb-6">
            <Building className="w-4 h-4 text-emerald-300" />
            <span>About NyumbaSwift</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Built for Dar es Salaam rentals</h1>
          <p className="text-lg text-emerald-100 max-w-3xl leading-relaxed">
            NyumbaSwift is a verified rental marketplace helping renters, landlords, and agents connect with more trust, better transparency, and digital rent workflows that fit the local market.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid md:grid-cols-3 gap-6">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our mission</h2>
          <p className="text-gray-600 leading-8 mb-4">
            We want renting in Dar to feel safer, faster, and easier to manage. That means improving listing trust, reducing friction between renters and landlords, and giving agents a structured platform to operate professionally.
          </p>
          <p className="text-gray-600 leading-8">
            NyumbaSwift is designed to support the real rental journey: discovery, verification, contact unlocks, tenancy management, and payment tracking in one place.
          </p>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to explore the platform?</h2>
            <p className="text-gray-600">Browse available rentals or apply to join the verified agent network.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/properties" className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
              Browse Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/become-an-agent" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-xl font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors">
              Become an Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
