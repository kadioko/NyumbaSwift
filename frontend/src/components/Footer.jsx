import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto dark:bg-black/60 dark:border-t dark:border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">NyumbaSwift</span>
            </div>
            <p className="text-sm leading-relaxed">
              Dar es Salaam's verified rental marketplace. Find trusted homes, pay rent digitally.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">For Renters</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/properties" className="hover:text-white transition-colors">Search Properties</Link></li>
              <li><Link to="/properties" className="hover:text-white transition-colors">Verified Listings</Link></li>
              <li><Link to="/my-rentals" className="hover:text-white transition-colors">Pay Rent Online</Link></li>
              <li><Link to="/wallet" className="hover:text-white transition-colors">My Wallet</Link></li>
              <li><Link to="/agents" className="hover:text-white transition-colors">Find Agents</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">For Landlords</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/properties/new" className="hover:text-white transition-colors">List Property</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Collect Rent</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Manage Tenants</Link></li>
              <li><Link to="/properties" className="hover:text-white transition-colors">Premium Listings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About NyumbaSwift</Link></li>
              <li><Link to="/become-an-agent" className="hover:text-white transition-colors">Become an Agent</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-sm text-center dark:border-white/6">
          &copy; 2026 NyumbaSwift. Built for Dar es Salaam.
        </div>
      </div>
    </footer>
  )
}
