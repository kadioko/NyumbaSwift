import { Link } from 'react-router-dom'
import { Search, Shield, CreditCard, Users, Building, ArrowRight, Star, TrendingUp, CheckCircle, BadgeCheck, Clock3 } from 'lucide-react'

const stats = [
  { label: 'Verified Listings', value: '300K+', icon: Building },
  { label: 'Rent Processed', value: 'TZS 3B/mo', icon: CreditCard },
  { label: 'Verified Agents', value: '500+', icon: Users },
  { label: 'Happy Tenants', value: '12K+', icon: Star },
]

const steps = [
  {
    step: '01',
    title: 'Search Verified Listings',
    desc: 'Browse properties verified by our team. Filter by district, price, bedrooms, and more. Premium listings from trusted landlords.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Unlock & Connect',
    desc: 'Found your place? Unlock the landlord contact for TZS 5,000 and move the conversation forward faster.',
    icon: Shield,
  },
  {
    step: '03',
    title: 'Pay Rent Digitally',
    desc: 'Track payments, receipts, and rent history in one place without juggling chats and manual follow-ups.',
    icon: CreditCard,
  },
]

const landlordBenefits = [
  'Automated rent collection via M-Pesa',
  'Real-time payment tracking dashboard',
  'Verified tenant profiles',
  'Premium listing boost for faster occupancy',
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-16 right-12 h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm mb-6">
                <Shield className="w-4 h-4 text-emerald-300" />
                <span>Dar es Salaam's verified rental marketplace</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Find your next home
                <span className="block text-emerald-300">with more trust and less stress</span>
              </h1>
              <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl leading-relaxed mb-8">
                Verified listings, identity-reviewed renters, trusted agents, and digital rent collection — built for how Dar actually rents.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/properties" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-lg font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors shadow-sm">
                  <Search className="w-5 h-5" />
                  Browse Rentals
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400 bg-emerald-600 px-6 py-3.5 text-lg font-semibold text-white hover:bg-emerald-500 transition-colors">
                  List Your Property
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                {[{ title: 'Verified identities', desc: 'Admins can review ID submissions for extra trust.', icon: BadgeCheck }, { title: 'Digital workflows', desc: 'Unlocks, receipts, and rent flow in-app.', icon: CreditCard }, { title: 'Faster decisions', desc: 'Less guesswork, cleaner signals, quicker move-ins.', icon: Clock3 }].map(({ title, desc, icon }) => {
                  const Icon = icon
                  return (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <Icon className="w-5 h-5 text-emerald-300 mb-3" />
                      <div className="text-sm font-semibold text-white mb-1">{title}</div>
                      <div className="text-sm text-emerald-100/80 leading-relaxed">{desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-2xl">
                <div className="rounded-2xl bg-white p-5 text-gray-900 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Marketplace snapshot</div>
                      <div className="text-xl font-bold">Today on NyumbaSwift</div>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Live overview
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[['Verified landlord listings', '128'], ['Pending renter verifications', '12'], ['Unlocks completed this week', '43']].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-sm font-medium text-emerald-700 mb-1">Built for trust-first renting</div>
                    <div className="text-sm leading-relaxed text-gray-600">
                      Cleaner property presentation, better screening, and faster renter-landlord connection without relying on scattered chats.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon }) => {
              const Icon = icon
              return (
                <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-5 text-center">
                  <Icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How NyumbaSwift Works</h2>
            <p className="max-w-xl mx-auto text-gray-500">Simple, transparent, and built for Dar's rental market.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc, icon }) => {
              const Icon = icon
              return (
                <div key={step} className="rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-emerald-200 hover:shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{step}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="leading-relaxed text-gray-500">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-4">
                <TrendingUp className="w-4 h-4" />
                For Landlords
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Collect rent without the headache</h2>
              <p className="mb-6 leading-relaxed text-gray-500">
                Stop chasing tenants for rent. NyumbaSwift supports digital collection, cleaner communication, and a stronger trust layer across your portfolio.
              </p>
              <ul className="mb-8 space-y-3">
                {landlordBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition-colors">
                Start Managing Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-8">
              <div className="mb-4 rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-1 text-sm text-gray-500">Monthly Rent Collected</div>
                <div className="text-3xl font-bold text-gray-900">TZS 12,400,000</div>
                <div className="mt-1 text-sm text-emerald-600">+23% from last month</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm text-gray-500">Properties</div>
                  <div className="text-xl font-bold text-gray-900">8</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm text-gray-500">Occupancy</div>
                  <div className="text-xl font-bold text-emerald-600">94%</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm text-gray-500">Active Tenants</div>
                  <div className="text-xl font-bold text-gray-900">7</div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm text-gray-500">Platform Fee</div>
                  <div className="text-xl font-bold text-gray-900">1.5%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h2 className="mb-4 text-3xl font-bold">Are you a broker?</h2>
          <p className="mx-auto mb-8 max-w-xl leading-relaxed text-gray-400">
            Turn market knowledge into verified income. Become a NyumbaSwift Verified Agent and get better visibility, cleaner workflows, and stronger trust with renters and landlords.
          </p>
          <Link to="/agents/apply" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-lg font-semibold text-white hover:bg-emerald-500 transition-colors">
            Apply as Verified Agent
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
