export default function TermsConditions() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-10 shadow-sm">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8 leading-8">
            These terms govern your use of NyumbaSwift. By using the platform, you agree to use it responsibly, provide accurate information, and comply with applicable laws and rental obligations.
          </p>

          <div className="space-y-8 text-gray-600 leading-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Platform use</h2>
              <p>
                Users must provide truthful profile and listing information. Misleading listings, impersonation, fraud, or misuse of payment and contact workflows may result in account suspension or removal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Listings and agent activity</h2>
              <p>
                Landlords and agents are responsible for the accuracy of listing details, pricing, location information, and availability. NyumbaSwift may review, reject, or remove content that violates platform standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Payments and fees</h2>
              <p>
                Digital rent collection, contact unlock fees, and premium listing services may involve platform charges. Users are responsible for reviewing transaction details before confirming payment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Limitation of responsibility</h2>
              <p>
                NyumbaSwift provides marketplace and workflow tools but does not automatically guarantee the behavior of every renter, landlord, or agent. Users should still exercise appropriate due diligence before entering agreements.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
