export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-10 shadow-sm">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8 leading-8">
            NyumbaSwift collects only the information needed to operate the rental platform, improve trust, support listings, and manage payments and account workflows.
          </p>

          <div className="space-y-8 text-gray-600 leading-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Information we collect</h2>
              <p>
                This may include account details, phone number, email address, profile information, listing content, rental activity, and payment-related records generated through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">How we use information</h2>
              <p>
                We use collected data to provide platform access, verify users and listings, support rental workflows, communicate important updates, and improve the user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data sharing</h2>
              <p>
                NyumbaSwift shares data only as needed to operate the service, complete requested workflows, comply with legal obligations, or support account and transaction operations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Security and retention</h2>
              <p>
                We work to protect user data with reasonable safeguards and retain information only as long as needed for platform operations, compliance, dispute handling, or service improvement.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
