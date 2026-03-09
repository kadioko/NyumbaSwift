import { Home } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
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
              <li>Search Properties</li>
              <li>Verified Listings</li>
              <li>Pay Rent Online</li>
              <li>Find Agents</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">For Landlords</h4>
            <ul className="space-y-2 text-sm">
              <li>List Property</li>
              <li>Collect Rent</li>
              <li>Manage Tenants</li>
              <li>Premium Listings</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>About NyumbaSwift</li>
              <li>Become an Agent</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; 2026 NyumbaSwift. Built for Dar es Salaam.
        </div>
      </div>
    </footer>
  )
}
