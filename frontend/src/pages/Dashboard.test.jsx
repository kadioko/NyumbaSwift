import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api', () => ({
  auth: {
    pendingVerifications: vi.fn(),
    reviewVerification: vi.fn(),
  },
  dashboard: {
    platformStats: vi.fn(),
    landlordSummary: vi.fn(),
    landlordProperties: vi.fn(),
  },
}))

import Dashboard from './Dashboard'
import { useAuth } from '../context/useAuth'
import { auth as authApi, dashboard as dashApi } from '../services/api'

const adminUser = { id: 900, full_name: 'Admin User', role: 'admin' }
const pendingUser = {
  id: 22,
  full_name: 'Jane Pending',
  role: 'renter',
  phone: '0712345678',
  email: 'jane@example.com',
  national_id: '12345678',
  profile_photo_url: '',
}
const platformSummary = {
  total_properties: 14,
  active_listings: 9,
  active_rentals: 4,
  total_platform_revenue_tzs: 150000,
  total_rent_processed_tzs: 600000,
  unlock_fees_revenue_tzs: 25000,
}

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function openVerificationsTab() {
  const tab = await screen.findByRole('button', { name: 'verifications' })
  fireEvent.click(tab)
}

describe('Dashboard admin verification review UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    useAuth.mockReturnValue({ user: adminUser })
    dashApi.platformStats.mockResolvedValue(platformSummary)
    authApi.pendingVerifications.mockResolvedValue([pendingUser])
    authApi.reviewVerification.mockResolvedValue({ ...pendingUser, verification_status: 'verified' })
  })

  it('shows pending verifications for admins and removes a user after successful verification', async () => {
    render(<Dashboard />)

    await openVerificationsTab()

    await waitFor(() => {
      expect(screen.getByText('Jane Pending')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verify User' }))

    await waitFor(() => {
      expect(authApi.reviewVerification).toHaveBeenCalledWith(22, { verification_status: 'verified' })
    })

    expect(await screen.findByText('Jane Pending was verified successfully.')).toBeInTheDocument()
    expect(screen.queryByText('Jane Pending')).not.toBeInTheDocument()
    expect(screen.getByText('No pending user verifications')).toBeInTheDocument()
  })

  it('auto-dismisses the success banner after a successful review', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    render(<Dashboard />)

    await openVerificationsTab()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Verify User' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verify User' }))

    expect(await screen.findByText('Jane Pending was verified successfully.')).toBeInTheDocument()

    expect(setTimeoutSpy).toHaveBeenCalled()
    const dismissCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 3000)
    expect(dismissCall).toBeTruthy()
    const timeoutCallback = dismissCall[0]

    await act(async () => {
      timeoutCallback()
    })

    expect(screen.queryByText('Jane Pending was verified successfully.')).not.toBeInTheDocument()
  })

  it('shows an action-specific loading state while rejecting a verification', async () => {
    const deferred = createDeferred()
    authApi.reviewVerification.mockReturnValueOnce(deferred.promise)

    render(<Dashboard />)

    await openVerificationsTab()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))

    expect(screen.getByRole('button', { name: 'Rejecting...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Verify User' })).toBeDisabled()

    deferred.resolve({ ...pendingUser, verification_status: 'rejected' })

    expect(await screen.findByText('Jane Pending was rejected successfully.')).toBeInTheDocument()
    expect(screen.getByText('No pending user verifications')).toBeInTheDocument()
  })

  it('shows an error banner and keeps the pending user when review fails', async () => {
    authApi.reviewVerification.mockRejectedValueOnce(new Error('Review service unavailable.'))

    render(<Dashboard />)

    await openVerificationsTab()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Verify User' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Verify User' }))

    expect(await screen.findByText('Review service unavailable.')).toBeInTheDocument()
    expect(screen.getByText('Jane Pending')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
