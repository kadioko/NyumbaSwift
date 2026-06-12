import { Link } from 'react-router-dom'
import {
  Search,
  Shield,
  CreditCard,
  Users,
  Building,
  ArrowRight,
  Star,
  TrendingUp,
  CheckCircle,
  BadgeCheck,
  Clock3,
  MapPinned,
  Landmark,
  Sparkles,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'

const stats = [
  { label: 'Verified Listings', value: '300K+', icon: Building },
  { label: 'Rent Processed', value: 'TZS 3B/mo', icon: CreditCard },
  { label: 'Verified Agents', value: '500+', icon: Users },
  { label: 'Happy Tenants', value: '12K+', icon: Star },
]

const steps = [
  {
    step: '01',
    title: 'Search verified listings',
    desc: 'Browse properties reviewed by our team. Filter by district, price, bedrooms, and trust signals that help you shortlist faster.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Unlock and connect',
    desc: 'Found your place? Unlock the landlord contact for TZS 5,000 and move the conversation forward without guesswork.',
    icon: Shield,
  },
  {
    step: '03',
    title: 'Pay rent digitally',
    desc: 'Track payments, receipts, and rent history in one place without juggling chats, calls, and manual follow-ups.',
    icon: CreditCard,
  },
]

const landlordBenefits = [
  'Automated rent collection via mobile money',
  'Real-time payment tracking dashboard',
  'Verified tenant profiles',
  'Premium listing boost for faster occupancy',
]

const districts = ['Masaki', 'Mbezi Beach', 'Kijitonyama', 'Mikocheni']

const highlightCards = [
  {
    title: 'Verified identities',
    desc: 'Admins review submitted identity information to reduce fake listings and wasted time.',
    icon: BadgeCheck,
  },
  {
    title: 'Digital workflows',
    desc: 'Unlocks, receipts, rent tracking, and account history live in one experience.',
    icon: CreditCard,
  },
  {
    title: 'Faster decisions',
    desc: 'Trust signals help renters and landlords move from browsing to action more confidently.',
    icon: Clock3,
  },
]

export default function Landing() {
  const { isDark, toggle } = useTheme()
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(15,127,95,0.18),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(211,154,52,0.1),_transparent_26%)]" />
        <div className="shell-panel relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-16 text-white sm:px-8 lg:px-12 lg:py-20">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-12 top-14 h-56 w-56 rounded-full bg-emerald-300 blur-3xl" />
            <div className="absolute bottom-0 right-8 h-72 w-72 rounded-full bg-amber-300 blur-3xl" />
            <div className="absolute inset-y-0 right-1/3 w-px bg-white/10" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-slate-950/26 px-4 py-1.5 text-sm text-white shadow-sm backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-emerald-300" />
                  <span>Dar es Salaam&apos;s verified rental marketplace</span>
                </div>
                <button
                  type="button"
                  onClick={toggle}
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-slate-950/28 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-950/40"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-emerald-300" />}
                  <span>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
                </button>
              </div>
              <h1 className="text-balance mb-6 max-w-3xl text-4xl font-bold leading-[0.95] sm:text-5xl lg:text-7xl">
                Renting that feels
                <span className="block text-emerald-300">clear, trusted, and modern.</span>
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-emerald-50/88 sm:text-xl">
                Verified listings, identity-reviewed renters, trusted agents, and digital rent collection built for how Dar actually rents.
              </p>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row">
                <Link to="/properties" className="hero-primary-cta inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-300 px-6 py-3.5 text-lg font-semibold text-slate-950 shadow-[0_22px_44px_rgba(8,17,13,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-amber-200">
                  <Search className="h-5 w-5" />
                  Browse Rentals
                </Link>
                <Link to="/register" className="hero-secondary-cta inline-flex items-center justify-center gap-2 rounded-2xl border border-white/22 bg-slate-950/30 px-6 py-3.5 text-lg font-semibold text-white shadow-[0_18px_36px_rgba(8,17,13,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-slate-950/42">
                  {user ? 'Add Another Listing' : 'List Your Property'}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {user && (
                  <Link to="/wallet" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/14 px-6 py-3.5 text-lg font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-400/22">
                    <Wallet className="h-5 w-5" />
                    Open Wallet
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {districts.map((district) => (
                  <span key={district} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-emerald-50/88">
                    <MapPinned className="h-3.5 w-3.5 text-emerald-300" />
                    {district}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:pl-4">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/9 p-5 backdrop-blur-xl shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.18em] text-emerald-100/70">Marketplace snapshot</div>
                    <div className="text-2xl font-bold">Today on NyumbaSwift</div>
                  </div>
                  <div className="rounded-full bg-emerald-300/16 px-3 py-1 text-xs font-medium text-emerald-100">
                    Live overview
                  </div>
                </div>
                <div className="space-y-3">
                  {[['Verified landlord listings', '128'], ['Pending renter verifications', '12'], ['Unlocks completed this week', '43']].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/22 px-4 py-3">
                      <span className="text-sm text-emerald-50/80">{label}</span>
                      <span className="text-sm font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
                  <Sparkles className="mb-3 h-5 w-5 text-amber-300" />
                  <div className="text-sm text-emerald-100/70">Trust layer</div>
                  <div className="mt-1 text-lg font-semibold">Verification-first discovery</div>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/78">
                    Cleaner property presentation and stronger renter confidence before the first call.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5">
                  <Landmark className="mb-3 h-5 w-5 text-emerald-300" />
                  <div className="text-sm text-emerald-100/70">Landlord ops</div>
                  <div className="mt-1 text-lg font-semibold">Payments and portfolio visibility</div>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/78">
                    Manage listings, occupancy, and rent flow without relying on scattered chats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-white/78 p-4 shadow-[0_16px_40px_rgba(17,36,25,0.08)] backdrop-blur-xl md:grid-cols-3 dark:border-white/8 dark:bg-slate-900/80">
            {highlightCards.map(({ title, desc, icon }) => {
              const Icon = icon
              return (
                <div key={title} className="rounded-[1.25rem] border border-slate-100 bg-gradient-to-br from-white to-emerald-50/65 p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
                  <Icon className="mb-4 h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <div className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</div>
                  <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70 backdrop-blur dark:border-white/8 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map(({ label, value, icon }) => {
              const Icon = icon
              return (
                <div key={label} className="rounded-[1.4rem] border border-slate-100 bg-white/85 px-4 py-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <Icon className="mx-auto mb-2 h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                  <div className="text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="eyebrow mb-4">How it works</span>
            <h2 className="mx-auto mb-3 max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl dark:text-white">A simpler path from search to signed rental</h2>
            <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
              Designed for the real rhythms of Dar&apos;s market, from discovery to contact unlock to payment follow-through.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ step, title, desc, icon }) => {
              const Icon = icon
              return (
                <div key={step} className="shell-card rounded-[1.6rem] p-8 transition-all hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-700">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
                      <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{step}</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white/72 py-20 backdrop-blur dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                For Landlords
              </div>
              <h2 className="mb-4 text-3xl font-bold text-slate-950 sm:text-4xl dark:text-white">Collect rent without the headache</h2>
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-slate-400">
                Stop chasing tenants for rent. NyumbaSwift supports digital collection, cleaner communication, and a stronger trust layer across your portfolio.
              </p>
              <ul className="mb-8 space-y-3">
                {landlordBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-white font-semibold shadow-[0_16px_28px_rgba(15,127,95,0.24)] transition-transform hover:-translate-y-0.5">
                Start Managing Properties
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-8 text-white shadow-[0_28px_90px_rgba(8,17,13,0.24)]">
              <div className="mb-4 rounded-[1.4rem] border border-white/10 bg-white/8 p-6">
                <div className="mb-1 text-sm text-emerald-100/75">Monthly Rent Collected</div>
                <div className="text-3xl font-bold">TZS 12,400,000</div>
                <div className="mt-1 text-sm text-emerald-300">+23% from last month</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                  <div className="text-sm text-emerald-100/75">Properties</div>
                  <div className="text-xl font-bold">8</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                  <div className="text-sm text-emerald-100/75">Occupancy</div>
                  <div className="text-xl font-bold text-emerald-300">94%</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                  <div className="text-sm text-emerald-100/75">Active Tenants</div>
                  <div className="text-xl font-bold">7</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                  <div className="text-sm text-emerald-100/75">Platform Fee</div>
                  <div className="text-xl font-bold">1.5%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="shell-panel mx-auto max-w-7xl rounded-[2rem] px-6 py-16 text-center text-white sm:px-8">
          <Users className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Are you a broker?</h2>
          <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-emerald-50/70">
            Turn market knowledge into verified income. Become a NyumbaSwift Verified Agent and get better visibility, cleaner workflows, and stronger trust with renters and landlords.
          </p>
          <Link to="/agents/apply" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-lg font-semibold text-emerald-900 transition-transform hover:-translate-y-0.5 hover:bg-emerald-50">
            Apply as Verified Agent
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
