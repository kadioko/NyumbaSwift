import { Link } from 'react-router-dom'
import { Search, Shield, CreditCard, Users, Building, ArrowRight, Star, TrendingUp, CheckCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>Dar es Salaam's #1 Verified Rental Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <span className="block text-emerald-300">Home in Dar</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-8 max-w-xl leading-relaxed">
              No more Facebook groups. No more hand-painted signs. Verified listings, digital rent collection, and trusted agents — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/properties" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-800 px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors text-lg">
                <Search className="w-5 h-5" />
                Browse Rentals
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-500 transition-colors border border-emerald-500 text-lg">
                List Your Property
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Verified Listings', value: '300K+', icon: Building },
              { label: 'Rent Processed', value: '$3M/mo', icon: CreditCard },
              { label: 'Verified Agents', value: '500+', icon: Users },
              { label: 'Happy Tenants', value: '12K+', icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How NyumbaSwift Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Simple, transparent, and built for Dar's rental market</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search Verified Listings',
                desc: 'Browse properties verified by our team. Filter by district, price, bedrooms, and more. Premium listings from trusted landlords.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Unlock & Connect',
                desc: 'Found your place? Unlock the landlord\'s contact for TZS 5,000. Direct communication, no middleman markup.',
                icon: Shield,
              },
              {
                step: '03',
                title: 'Pay Rent Digitally',
                desc: 'Pay monthly rent via M-Pesa. Automatic receipts, payment history, and landlord gets instant notification.',
                icon: CreditCard,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <TrendingUp className="w-4 h-4" />
                For Landlords
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Collect Rent Without the Headache
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Stop chasing tenants for rent. NyumbaSwift handles digital collection via M-Pesa. Just 1.5% per transaction — and you get a full property management dashboard.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Automated rent collection via M-Pesa',
                  'Real-time payment tracking dashboard',
                  'Verified tenant profiles',
                  'Premium listing boost for faster occupancy',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                Start Managing Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <div className="text-sm text-gray-500 mb-1">Monthly Rent Collected</div>
                <div className="text-3xl font-bold text-gray-900">TZS 12,400,000</div>
                <div className="text-sm text-emerald-600 mt-1">+23% from last month</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-sm text-gray-500">Properties</div>
                  <div className="text-xl font-bold text-gray-900">8</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-sm text-gray-500">Occupancy</div>
                  <div className="text-xl font-bold text-emerald-600">94%</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-sm text-gray-500">Active Tenants</div>
                  <div className="text-xl font-bold text-gray-900">7</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-sm text-gray-500">Platform Fee</div>
                  <div className="text-xl font-bold text-gray-900">1.5%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become Agent CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Are You a Broker?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Turn your market knowledge into verified income. Become a NyumbaSwift Verified Agent — get a badge, digital tools, and earn commissions on every deal you facilitate.
          </p>
          <Link to="/agents/apply" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-emerald-500 transition-colors text-lg">
            Apply as Verified Agent
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
