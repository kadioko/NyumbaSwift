import { useState, useEffect, useCallback } from 'react'
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  RefreshCw,
  CreditCard,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Send,
} from 'lucide-react'
import { wallet as walletApi } from '../services/api'
import { bannerStyles, buttonStyles, inputStyles, skeletonBlock, surfaceCard } from '../components/ui'

const TAB_OVERVIEW = 'overview'
const TAB_DEPOSIT = 'deposit'
const TAB_WITHDRAW = 'withdraw'
const TAB_SEND = 'send'
const TAB_HISTORY = 'history'

function fmt(n) {
  return (n ?? 0).toLocaleString()
}

function StatusBadge({ status }) {
  const map = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    failed: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  }
  const icons = {
    completed: <CheckCircle className="h-3 w-3" />,
    processing: <Loader2 className="h-3 w-3 animate-spin" />,
    pending: <Clock className="h-3 w-3" />,
    failed: <AlertCircle className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {icons[status]}
      {status}
    </span>
  )
}

function TxIcon({ type }) {
  if (type === 'deposit') return <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
  if (type === 'withdrawal') return <ArrowUpCircle className="h-5 w-5 text-red-400" />
  if (type === 'transfer_in') return <ArrowDownCircle className="h-5 w-5 text-blue-500" />
  return <ArrowUpCircle className="h-5 w-5 text-orange-400" />
}

function TxLabel({ type }) {
  const labels = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer_in: 'Received',
    transfer_out: 'Sent',
  }
  return labels[type] || type
}

function TxSign({ type }) {
  return type === 'deposit' || type === 'transfer_in' ? (
    <span className="font-semibold text-emerald-600">+</span>
  ) : (
    <span className="font-semibold text-red-500">−</span>
  )
}

export default function Wallet() {
  const [walletData, setWalletData] = useState(null)
  const [allTxns, setAllTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState(TAB_OVERVIEW)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Deposit state
  const [depositMethod, setDepositMethod] = useState('mobile_money')
  const [depositForm, setDepositForm] = useState({ amount: '', phone: '' })
  const [depositing, setDepositing] = useState(false)
  const [depositResult, setDepositResult] = useState(null)
  const [confirmRef, setConfirmRef] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Withdraw state
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', phone: '' })
  const [withdrawing, setWithdrawing] = useState(false)

  // Send state
  const [sendForm, setSendForm] = useState({ recipient_phone: '', amount: '', note: '' })
  const [sending, setSending] = useState(false)

  const loadWallet = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const [w, txns] = await Promise.all([walletApi.get(), walletApi.transactions()])
      setWalletData(w)
      setAllTxns(txns)
      window.dispatchEvent(new CustomEvent('nyumbaswift:wallet-updated'))
    } catch (err) {
      setError(err.message || 'Could not load wallet data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadWallet() }, [loadWallet])

  const clearMessages = () => { setError(''); setSuccess('') }

  const handleDeposit = async (e) => {
    e.preventDefault()
    clearMessages()
    setDepositing(true)
    setDepositResult(null)
    try {
      const payload = {
        amount: Number(depositForm.amount),
        payment_method: depositMethod,
        ...(depositMethod === 'mobile_money'
          ? { phone: depositForm.phone }
          : {
              redirect_url: `${window.location.origin}/wallet?deposit=success`,
              cancel_url: `${window.location.origin}/wallet?deposit=cancelled`,
            }),
      }
      const result = await walletApi.deposit(payload)
      setDepositResult(result)
      setSuccess(depositMethod === 'mobile_money'
        ? 'Deposit initiated! Complete the mobile money prompt on your phone, then refresh your wallet balance.'
        : 'Card deposit started. Continue to the secure checkout, then return and refresh your wallet balance.')
    } catch (err) {
      setError(err.message)
    } finally {
      setDepositing(false)
    }
  }

  const handleConfirmDeposit = async () => {
    if (!depositResult || !confirmRef) return
    setConfirming(true)
    clearMessages()
    try {
      await walletApi.confirmDeposit(depositResult.id, { ntzs_reference: confirmRef })
      setDepositResult(null)
      setConfirmRef('')
      setDepositForm({ amount: '', phone: '' })
      await loadWallet(true)
      window.dispatchEvent(new CustomEvent('nyumbaswift:wallet-updated'))
      setSuccess('Deposit confirmed! Your balance has been updated.')
      setTab(TAB_OVERVIEW)
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    clearMessages()
    setWithdrawing(true)
    try {
      await walletApi.withdraw({ amount: Number(withdrawForm.amount), phone: withdrawForm.phone })
      setWithdrawForm({ amount: '', phone: '' })
      await loadWallet(true)
      window.dispatchEvent(new CustomEvent('nyumbaswift:wallet-updated'))
      setSuccess('Withdrawal initiated! Funds will arrive on your mobile money shortly.')
      setTab(TAB_OVERVIEW)
    } catch (err) {
      setError(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    clearMessages()
    setSending(true)
    try {
      await walletApi.send({ recipient_phone: sendForm.recipient_phone, amount: Number(sendForm.amount), note: sendForm.note || undefined })
      setSendForm({ recipient_phone: '', amount: '', note: '' })
      await loadWallet(true)
      window.dispatchEvent(new CustomEvent('nyumbaswift:wallet-updated'))
      setSuccess(`TZS ${Number(sendForm.amount).toLocaleString()} sent successfully!`)
      setTab(TAB_OVERVIEW)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="px-4 pt-5 sm:px-6 lg:px-8">
          <div className="shell-card mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-6">
            <div className={skeletonBlock('mb-4 h-8 w-48')} />
            <div className={skeletonBlock('h-4 w-64')} />
            <div className="mt-6">
              <div className={skeletonBlock('h-28 w-full rounded-2xl')} />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={surfaceCard('p-5')}>
              <div className="flex items-center justify-between">
                <div className={skeletonBlock('h-5 w-32')} />
                <div className={skeletonBlock('h-5 w-20')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const balance = walletData?.balance_tzs ?? 0
  const walletAddress = walletData?.wallet_address
  const stablecoinBalance = walletData?.balance_usdc
  const recent = walletData?.recent_transactions ?? []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 pt-5 sm:px-6 lg:px-8">
        <div className="shell-card mx-auto max-w-4xl overflow-hidden rounded-[2rem]">
          <div className="page-header-bg px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="eyebrow mb-3">NyumbaSwift Wallet</div>
                <h1 className="text-3xl font-bold text-slate-950 dark:text-white">My Wallet</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Deposit, withdraw, and send money in TZS</p>
              </div>

              {/* Balance card */}
              <div className="rounded-[1.4rem] border border-white/80 bg-white/85 px-6 py-5 shadow-sm min-w-[200px] dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <WalletIcon className="h-4 w-4" />
                    Balance
                  </div>
                  <button
                    onClick={() => loadWallet(true)}
                    disabled={refreshing}
                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                    title="Refresh balance"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-3xl font-bold text-slate-950 dark:text-white">
                  TZS {fmt(balance)}
                </div>
                {walletAddress && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Wallet: <span className="font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                  </div>
                )}
                {stablecoinBalance != null && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    USDC balance: <span className="font-semibold">{stablecoinBalance}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => { setTab(TAB_DEPOSIT); clearMessages() }}
                className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <ArrowDownCircle className="h-4 w-4" /> Deposit
              </button>
              <button
                onClick={() => { setTab(TAB_WITHDRAW); clearMessages() }}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowUpCircle className="h-4 w-4" /> Withdraw
              </button>
              <button
                onClick={() => { setTab(TAB_SEND); clearMessages() }}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {[
                [TAB_OVERVIEW, 'Overview'],
                [TAB_DEPOSIT, 'Deposit'],
                [TAB_WITHDRAW, 'Withdraw'],
                [TAB_SEND, 'Send'],
                [TAB_HISTORY, 'History'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); clearMessages() }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors whitespace-nowrap ${
                    tab === key
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white/85 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className={bannerStyles('error', 'mb-5 justify-between')}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="font-medium text-red-700 hover:text-red-800 text-xs">Dismiss</button>
          </div>
        )}
        {success && (
          <div className={bannerStyles('success', 'mb-5')}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* OVERVIEW */}
        {tab === TAB_OVERVIEW && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total In', value: allTxns.filter(t => ['deposit','transfer_in'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + t.amount, 0), icon: <ArrowDownCircle className="h-5 w-5 text-emerald-500" />, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Total Out', value: allTxns.filter(t => ['withdrawal','transfer_out'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + t.amount, 0), icon: <ArrowUpCircle className="h-5 w-5 text-red-400" />, color: 'text-red-500 dark:text-red-400' },
                { label: 'Transactions', value: null, count: allTxns.length, icon: <ArrowRightLeft className="h-5 w-5 text-slate-400" />, color: 'text-slate-700 dark:text-slate-300' },
              ].map((stat) => (
                <div key={stat.label} className={surfaceCard('p-5')}>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">{stat.icon}{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.count != null ? stat.count : `TZS ${fmt(stat.value)}`}
                  </div>
                </div>
              ))}
            </div>

            <div className={surfaceCard()}>
              <h2 className="text-sm font-semibold text-slate-700 mb-4 dark:text-slate-300">Recent Activity</h2>
              {recent.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                  <WalletIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm">No transactions yet. Deposit to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                      <TxIcon type={txn.type} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">
                          <TxLabel type={txn.type} />
                          {txn.description && <span className="ml-1.5 font-normal text-slate-500 text-xs dark:text-slate-500">&mdash; {txn.description}</span>}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(txn.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          <TxSign type={txn.type} /> TZS {fmt(txn.amount)}
                        </div>
                        <StatusBadge status={txn.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEPOSIT */}
        {tab === TAB_DEPOSIT && (
          <div className="mx-auto max-w-md">
            {depositResult ? (
              <div className={surfaceCard('space-y-5')}>
                <div className="text-center">
                  <ArrowDownCircle className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">Deposit Initiated</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {depositResult.provider_message || (
                      depositMethod === 'mobile_money'
                        ? 'Complete the mobile money prompt on your phone, then refresh your wallet balance.'
                        : 'Continue to the secure card checkout, then return and refresh your wallet balance.'
                    )}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-50 p-4 space-y-2 text-sm dark:bg-slate-800">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Amount</span><span className="font-medium dark:text-slate-200">TZS {fmt(depositResult.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Method</span><span className="font-medium capitalize dark:text-slate-200">{depositResult.payment_method?.replace('_', ' ')}</span></div>
                  {depositResult.ntzs_reference && (
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Reference</span><span className="font-mono text-xs dark:text-slate-300">{depositResult.ntzs_reference}</span></div>
                  )}
                </div>
                <div className="space-y-3">
                  {depositResult.payment_url && (
                    <a
                      href={depositResult.payment_url}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonStyles({ fullWidth: true })}
                    >
                      Continue to Card Checkout
                    </a>
                  )}
                  {!depositResult.payment_url && (
                    <>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Optional manual confirmation</label>
                      <input
                        type="text"
                        placeholder="Payment reference (e.g. T1234ABCD)"
                        value={confirmRef}
                        onChange={(e) => setConfirmRef(e.target.value.toUpperCase())}
                        className={inputStyles()}
                      />
                      <button onClick={handleConfirmDeposit} disabled={confirming || !confirmRef} className={buttonStyles({ fullWidth: true })}>
                        {confirming ? 'Confirming...' : 'Confirm Deposit'}
                      </button>
                    </>
                  )}
                  <button onClick={() => loadWallet(true)} className={buttonStyles({ variant: 'secondary', fullWidth: true })}>
                    Refresh Wallet Balance
                  </button>
                  <button onClick={() => { setDepositResult(null); setConfirmRef('') }} className={buttonStyles({ variant: 'secondary', fullWidth: true })}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDeposit} className={surfaceCard('space-y-5')}>
                <div className="text-center mb-2">
                  <ArrowDownCircle className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
                  <h3 className="font-semibold text-slate-950 dark:text-white">Deposit Funds</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Top up your NyumbaSwift wallet</p>
                </div>

                {/* Payment method toggle */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('mobile_money')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${depositMethod === 'mobile_money' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    <Smartphone className="h-4 w-4" /> Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('card')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${depositMethod === 'card' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    <CreditCard className="h-4 w-4" /> Card
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (TZS)</label>
                  <input
                    type="number"
                    min="1000"
                    placeholder="e.g. 50000"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className={inputStyles()}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Minimum TZS 1,000</p>
                </div>

                {depositMethod === 'mobile_money' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678 or 255712345678"
                      value={depositForm.phone}
                      onChange={(e) => setDepositForm({ ...depositForm, phone: e.target.value })}
                      className={inputStyles()}
                      required
                    />
                  </div>
                )}

                {depositMethod === 'card' && (
                  <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Card deposits use nTZS&apos;s hosted checkout. After you submit the amount, we&apos;ll give you a secure payment link and you can return here to refresh your wallet balance.
                  </div>
                )}

                <button type="submit" disabled={depositing} className={buttonStyles({ fullWidth: true })}>
                  {depositing ? 'Initiating...' : `Deposit via ${depositMethod === 'mobile_money' ? 'Mobile Money' : 'Card'}`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* WITHDRAW */}
        {tab === TAB_WITHDRAW && (
          <div className="mx-auto max-w-md">
            <form onSubmit={handleWithdraw} className={surfaceCard('space-y-5')}>
              <div className="text-center mb-2">
                <ArrowUpCircle className="mx-auto mb-2 h-10 w-10 text-slate-600 dark:text-slate-400" />
                <h3 className="font-semibold text-slate-950 dark:text-white">Withdraw Funds</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send your wallet balance to mobile money</p>
              </div>

              <div className="rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center justify-between dark:bg-emerald-900/30 dark:text-emerald-400">
                <span>Available balance</span>
                <span className="font-bold">TZS {fmt(balance)}</span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (TZS)</label>
                <input
                  type="number"
                  min="1000"
                  max={balance}
                  placeholder="e.g. 20000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className={inputStyles()}
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Minimum TZS 1,000 &middot; Maximum TZS {fmt(balance)}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Receive on Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={withdrawForm.phone}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
                  className={inputStyles()}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={withdrawing || balance === 0}
                className={buttonStyles({ fullWidth: true })}
              >
                {withdrawing ? 'Processing...' : 'Withdraw to Mobile Money'}
              </button>
            </form>
          </div>
        )}

        {/* SEND */}
        {tab === TAB_SEND && (
          <div className="mx-auto max-w-md">
            <form onSubmit={handleSend} className={surfaceCard('space-y-5')}>
              <div className="text-center mb-2">
                <Send className="mx-auto mb-2 h-10 w-10 text-slate-600" />
                <h3 className="font-semibold text-slate-950 dark:text-white">Send Money</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Instantly send TZS to any NyumbaSwift user</p>
              </div>

              <div className="rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center justify-between dark:bg-emerald-900/30 dark:text-emerald-400">
                <span>Available balance</span>
                <span className="font-bold">TZS {fmt(balance)}</span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Recipient Phone</label>
                <input
                  type="tel"
                  placeholder="Registered NyumbaSwift phone"
                  value={sendForm.recipient_phone}
                  onChange={(e) => setSendForm({ ...sendForm, recipient_phone: e.target.value })}
                  className={inputStyles()}
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Must be a registered NyumbaSwift user</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (TZS)</label>
                <input
                  type="number"
                  min="100"
                  max={balance}
                  placeholder="e.g. 5000"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                  className={inputStyles()}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Note <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Rent deposit, Mwezi wa 4"
                  value={sendForm.note}
                  onChange={(e) => setSendForm({ ...sendForm, note: e.target.value })}
                  className={inputStyles()}
                />
              </div>

              <button
                type="submit"
                disabled={sending || balance === 0}
                className={buttonStyles({ fullWidth: true })}
              >
                {sending ? 'Sending...' : 'Send Money'}
              </button>
            </form>
          </div>
        )}

        {/* HISTORY */}
        {tab === TAB_HISTORY && (
          <div className="space-y-2">
            {allTxns.length === 0 ? (
              <div className={surfaceCard('py-12 text-center')}>
                <ArrowRightLeft className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">No transaction history</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your deposits, withdrawals, and transfers will appear here.</p>
              </div>
            ) : (
              allTxns.map((txn) => (
                <div key={txn.id} className={surfaceCard('flex items-center gap-3 p-4')}>
                  <TxIcon type={txn.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      <TxLabel type={txn.type} />
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{txn.description || '—'} &middot; {new Date(txn.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <TxSign type={txn.type} /> TZS {fmt(txn.amount)}
                    </div>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
