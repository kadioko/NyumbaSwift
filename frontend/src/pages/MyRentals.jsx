import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Calendar, Home, Loader2, AlertCircle, CheckCircle, Wallet, ArrowRightLeft } from 'lucide-react'
import { rentals as rentalApi } from '../services/api'
import { bannerStyles, buttonStyles, inputStyles, skeletonBlock, surfaceCard } from '../components/ui'

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

  const currentMonth = new Date().toISOString().slice(0, 7)

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
      <div className="min-h-screen">
        <div className="px-4 pt-5 sm:px-6 lg:px-8">
          <div className="shell-card mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-6">
            <div className={skeletonBlock('mb-4 h-8 w-48')} />
            <div className={skeletonBlock('h-4 w-64')} />
            <div className="mt-6 flex gap-2">
              <div className={skeletonBlock('h-10 w-24 rounded-full')} />
              <div className={skeletonBlock('h-10 w-24 rounded-full')} />
              <div className={skeletonBlock('h-10 w-24 rounded-full')} />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={surfaceCard('p-5')}>
                <div className="mb-3 flex items-center justify-between">
                  <div className={skeletonBlock('h-5 w-28')} />
                  <div className={skeletonBlock('h-6 w-16 rounded-full')} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={skeletonBlock('h-14')} />
                  <div className={skeletonBlock('h-14')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeRentals = myRentals.filter((rental) => rental.status === 'active')

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-5 sm:px-6 lg:px-8">
        <div className="shell-card mx-auto max-w-4xl overflow-hidden rounded-[2rem]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,127,95,0.15),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(211,154,52,0.12),_transparent_20%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(240,247,241,0.94))] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="eyebrow mb-3">Renter workspace</div>
                <h1 className="text-3xl font-bold text-slate-950">My Rentals</h1>
                <p className="mt-1 text-slate-600">Manage your rentals and pay rent</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/80 bg-white/85 px-5 py-4 shadow-sm">
                <div className="text-sm text-slate-500">Active rentals</div>
                <div className="text-3xl font-bold text-slate-950">{activeRentals.length}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto">
              {['rentals', 'pay rent', 'history'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                    tab === t
                      ? 'bg-slate-950 text-white'
                      : 'bg-white/85 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className={bannerStyles('error', 'mb-6 justify-between')}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadRentalData} className="font-medium text-red-700 hover:text-red-800">
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className={bannerStyles('success', 'mb-6')}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {tab === 'rentals' && (
          <div className="space-y-4">
            {myRentals.length === 0 ? (
              <div className={surfaceCard('py-12 text-center')}>
                <Home className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <h3 className="font-semibold text-slate-700">No active rentals</h3>
                <p className="mt-1 text-slate-500">Your rental agreements will appear here.</p>
                <div className="mt-5 rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  When you sign a rental through NyumbaSwift, payment tracking and history will show up automatically.
                </div>
              </div>
            ) : (
              myRentals.map((rental) => (
                <div key={rental.id} className={surfaceCard('p-5')}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold text-slate-950">Rental #{rental.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      rental.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rental.status}
                    </span>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-400">Monthly Rent:</span> TZS {rental.monthly_rent?.toLocaleString()}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <span className="text-slate-400">Started:</span> {new Date(rental.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'pay rent' && (
          <div className="mx-auto max-w-md">
            {!payResult && activeRentals.length === 0 ? (
              <div className={surfaceCard('py-10 text-center')}>
                <Wallet className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <h3 className="mb-1 font-semibold text-slate-700">No active rentals available for payment</h3>
                <p className="text-slate-500">Once you have an active rental, you&apos;ll be able to initiate rent payments here.</p>
              </div>
            ) : payResult ? (
              <div className={surfaceCard()}>
                <div className="mb-6 text-center">
                  <ArrowRightLeft className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950">Payment Initiated</h3>
                  <p className="mt-1 text-sm text-slate-500">Complete payment via M-Pesa, then enter the reference.</p>
                </div>
                <div className="mb-4 space-y-2 rounded-[1.2rem] bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-medium">TZS {payResult.amount?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Platform Fee</span><span className="font-medium">TZS {payResult.platform_fee?.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Landlord Receives</span><span className="font-bold text-emerald-700">TZS {payResult.landlord_payout?.toLocaleString()}</span></div>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="M-Pesa Reference (e.g. MPESA123ABC)"
                    value={confirmRef}
                    onChange={(e) => setConfirmRef(e.target.value.toUpperCase())}
                    className={inputStyles()}
                  />
                  <button onClick={handleConfirm} disabled={confirming || !confirmRef} className={buttonStyles({ fullWidth: true })}>
                    {confirming ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePay} className={surfaceCard('space-y-5')}>
                <div className="mb-2 text-center">
                  <CreditCard className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950">Pay Rent</h3>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Rental</label>
                  <select
                    value={payForm.rental_id}
                    onChange={(e) => setPayForm({ ...payForm, rental_id: e.target.value })}
                    className={inputStyles()}
                    required
                  >
                    <option value="">Select rental</option>
                    {activeRentals.map((rental) => (
                      <option key={rental.id} value={rental.id}>Rental #{rental.id} - TZS {rental.monthly_rent?.toLocaleString()}/mo</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Month</label>
                  <input
                    type="month"
                    value={payForm.payment_month || currentMonth}
                    onChange={(e) => setPayForm({ ...payForm, payment_month: e.target.value })}
                    className={inputStyles()}
                    required
                  />
                </div>
                <button type="submit" disabled={paying || activeRentals.length === 0} className={buttonStyles({ fullWidth: true })}>
                  {paying ? 'Processing...' : 'Initiate Payment'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className={surfaceCard('py-12 text-center')}>
                <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <h3 className="font-semibold text-slate-700">No payment history</h3>
                <p className="mt-1 text-slate-500">Completed and pending rent payments will show up here once you start paying through the platform.</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className={surfaceCard('flex items-center justify-between p-4')}>
                  <div>
                    <div className="font-medium text-slate-900">TZS {payment.amount?.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">{payment.payment_month} &middot; {payment.mpesa_reference || 'Pending'}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    payment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {payment.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                    {payment.status}
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
