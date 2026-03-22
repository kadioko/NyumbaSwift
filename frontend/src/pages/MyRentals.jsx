import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Calendar, Home, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { rentals as rentalApi } from '../services/api'

export default function MyRentals() {
  const [myRentals, setMyRentals] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [payForm, setPayForm] = useState({ rental_id: '', payment_month: '' })
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState(null)
  const [confirmRef, setConfirmRef] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('rentals')

  const loadRentalData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, p] = await Promise.all([rentalApi.my(), rentalApi.paymentHistory()])
      setMyRentals(r)
      setPayments(p)
    } catch (err) {
      setMyRentals([])
      setPayments([])
      setError(err.message || 'Unable to load your rental information right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRentalData()
  }, [loadRentalData])

  const handlePay = async (e) => {
    e.preventDefault()
    setPaying(true)
    setError('')
    setSuccess('')
    setPayResult(null)
    try {
      const data = await rentalApi.pay({
        rental_id: Number(payForm.rental_id),
        payment_month: payForm.payment_month || currentMonth,
      })
      setPayResult(data)
      setSuccess('Payment request created. Complete the payment and then confirm the M-Pesa reference below.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPaying(false)
    }
  }

  const handleConfirm = async () => {
    if (!payResult || !confirmRef) return
    setConfirming(true)
    setError('')
    setSuccess('')
    try {
      await rentalApi.confirmPayment(payResult.id, confirmRef)
      setPayResult(null)
      setConfirmRef('')
      setPayForm({ rental_id: '', payment_month: '' })
      await loadRentalData()
      setSuccess('Payment confirmed successfully and your history has been updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
          <p className="text-gray-500 mt-0.5">Manage your rentals and pay rent</p>
          <div className="flex gap-1 mt-6 -mb-px">
            {['rentals', 'pay rent', 'history'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  tab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadRentalData} className="font-medium text-red-700 hover:text-red-800">
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm border border-emerald-100">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {tab === 'rentals' && (
          <div className="space-y-4">
            {myRentals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700">No active rentals</h3>
                <p className="text-gray-500 mt-1">Your rental agreements will appear here</p>
              </div>
            ) : (
              myRentals.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Rental #{r.id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-400">Monthly Rent:</span> TZS {r.monthly_rent?.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-400">Started:</span> {new Date(r.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'pay rent' && (
          <div className="max-w-md mx-auto">
            {!payResult && myRentals.filter((r) => r.status === 'active').length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">No active rentals available for payment</h3>
                <p className="text-gray-500">Once you have an active rental, you&apos;ll be able to initiate rent payments here.</p>
              </div>
            ) : payResult ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <CreditCard className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Payment Initiated</h3>
                  <p className="text-sm text-gray-500 mt-1">Complete payment via M-Pesa, then enter the reference</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">TZS {payResult.amount?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="font-medium">TZS {payResult.platform_fee?.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Landlord Receives</span><span className="font-bold text-emerald-600">TZS {payResult.landlord_payout?.toLocaleString()}</span></div>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="M-Pesa Reference (e.g. MPESA123ABC)"
                    value={confirmRef}
                    onChange={(e) => setConfirmRef(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleConfirm}
                    disabled={confirming || !confirmRef}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {confirming ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePay} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="text-center mb-2">
                  <CreditCard className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Pay Rent</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rental</label>
                  <select
                    value={payForm.rental_id}
                    onChange={(e) => setPayForm({ ...payForm, rental_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="">Select rental</option>
                    {myRentals.filter((r) => r.status === 'active').map((r) => (
                      <option key={r.id} value={r.id}>Rental #{r.id} — TZS {r.monthly_rent?.toLocaleString()}/mo</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Month</label>
                  <input
                    type="month"
                    value={payForm.payment_month || currentMonth}
                    onChange={(e) => setPayForm({ ...payForm, payment_month: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={paying || myRentals.filter((r) => r.status === 'active').length === 0}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Initiate Payment'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700">No payment history</h3>
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">TZS {p.amount?.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{p.payment_month} &middot; {p.mpesa_reference || 'Pending'}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
