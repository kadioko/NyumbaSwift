import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
  properties: {
    update: vi.fn(),
    boost: vi.fn(),
  },
}))

import Dashboard from './Dashboard'
import { useAuth } from '../context/useAuth'
import { auth as authApi, dashboard as dashApi, properties as propApi } from '../services/api'

const adminUser = { id: 900, full_name: 'Admin User', role: 'admin' }
const landlordUser = { id: 901, full_name: 'Landlord User', role: 'landlord' }
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
const landlordSummary = {
  total_properties: 2,
  active_listings: 1,
  active_rentals: 0,
  total_rent_collected_tzs: 0,
  total_platform_fees_tzs: 0,
  pending_payments: 0,
}
const activeVerifiedProperty = {
  property_id: 44,
  title: 'Palm Residency',
  district: 'Kinondoni',
  status: 'active',
  rent_amount: 800000,
  is_verified: true,
  is_premium: false,
  current_tenant: null,
}
const inactiveUnverifiedProperty = {
  property_id: 45,
  title: 'Coral Suites',
  district: 'Ilala',
  status: 'inactive',
  rent_amount: 500000,
  is_verified: false,
  is_premium: false,
  current_tenant: null,
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

async function openPropertiesTab() {
  const tab = await screen.findByRole('button', { name: 'properties' })
  fireEvent.click(tab)
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
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
    renderDashboard()

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

    renderDashboard()

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

    renderDashboard()

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

    renderDashboard()

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

describe('Dashboard landlord property lifecycle UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    useAuth.mockReturnValue({ user: landlordUser })
    dashApi.landlordSummary.mockResolvedValue(landlordSummary)
    dashApi.landlordProperties.mockResolvedValue([activeVerifiedProperty, inactiveUnverifiedProperty])
    propApi.update.mockReset()
    propApi.boost.mockReset()
  })

  it('deactivates an active verified listing and shows success feedback', async () => {
    propApi.update.mockResolvedValue({
      id: 44,
      status: 'inactive',
      rent_amount: 800000,
      is_verified: true,
      is_premium: false,
    })

    renderDashboard()

    await openPropertiesTab()

    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate' })[0])

    await waitFor(() => {
      expect(propApi.update).toHaveBeenCalledWith(44, { status: 'inactive' })
    })

    expect(await screen.findByText('Palm Residency is now inactive.')).toBeInTheDocument()
  })

  it('shows the backend error when activating an unverified listing is blocked', async () => {
    propApi.update.mockRejectedValueOnce(new Error('Only verified listings can be activated'))

    renderDashboard()

    await openPropertiesTab()

    fireEvent.click(screen.getAllByRole('button', { name: 'Activate' })[0])

    expect(await screen.findByText('Only verified listings can be activated')).toBeInTheDocument()
    expect(screen.getByText('Coral Suites')).toBeInTheDocument()
  })

  it('boosts an active verified listing and marks it as premium', async () => {
    propApi.boost.mockResolvedValue({
      id: 44,
      status: 'active',
      rent_amount: 800000,
      is_verified: true,
      is_premium: true,
    })

    renderDashboard()

    await openPropertiesTab()

    fireEvent.click(screen.getAllByRole('button', { name: 'Boost Listing' })[0])

    await waitFor(() => {
      expect(propApi.boost).toHaveBeenCalledWith(44)
    })

    expect(await screen.findByText('Palm Residency was boosted successfully.')).toBeInTheDocument()
    expect(screen.getAllByText('Premium Active').length).toBeGreaterThan(0)
  })

  it('shows boost errors without removing the property card', async () => {
    propApi.boost.mockRejectedValueOnce(new Error('Only active verified listings can be boosted'))

    renderDashboard()

    await openPropertiesTab()

    fireEvent.click(screen.getAllByRole('button', { name: 'Boost Listing' })[1])

    expect(await screen.findByText('Only active verified listings can be boosted')).toBeInTheDocument()
    expect(screen.getByText('Coral Suites')).toBeInTheDocument()
  })
})
