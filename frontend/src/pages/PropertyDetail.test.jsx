import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api', () => ({
  properties: {
    get: vi.fn(),
  },
  rentals: {
    unlock: vi.fn(),
    unlockStatus: vi.fn(),
  },
}))

const mockParams = { id: '12' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockParams,
  }
})

import PropertyDetail from './PropertyDetail'
import { useAuth } from '../context/useAuth'
import { properties as propApi, rentals } from '../services/api'

const property = {
  id: 12,
  title: 'Ocean View Apartment',
  street: 'Main Street',
  ward: 'Kijitonyama',
  district: 'Kinondoni',
  bedrooms: 2,
  bathrooms: 1,
  size_sqm: 75,
  description: 'Bright apartment near the main road.',
  has_water: true,
  has_electricity: true,
  has_parking: false,
  has_security: true,
  furnished: false,
  is_premium: false,
  is_verified: true,
  rent_amount: 450000,
  deposit_amount: 450000,
  photos: [],
}

function renderPropertyDetail(user = null) {
  useAuth.mockReturnValue({ user })
  return render(
    <MemoryRouter>
      <PropertyDetail />
    </MemoryRouter>,
  )
}

describe('PropertyDetail unlock UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    propApi.get.mockResolvedValue(property)
    rentals.unlock.mockReset()
    rentals.unlockStatus.mockReset()
  })

  it('shows a sign-in CTA to guests instead of the unlock button', async () => {
    rentals.unlockStatus.mockRejectedValue(new Error('Unlock not found'))
    renderPropertyDetail(null)

    expect(await screen.findByText('Ocean View Apartment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign In to Contact Owner' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Unlock Contact/i })).not.toBeInTheDocument()
  })

  it('shows the pending unlock state for authenticated users with a pending payment', async () => {
    rentals.unlockStatus.mockResolvedValue({
      payment_status: 'pending',
      message: 'Awaiting mobile money approval.',
    })

    renderPropertyDetail({ id: 3, role: 'renter', full_name: 'Renter User' })

    expect(await screen.findByText('Payment Pending')).toBeInTheDocument()
    expect(screen.getByText(/Approve the mobile money prompt on your phone/i)).toBeInTheDocument()
  })

  it('reveals the landlord contact when the unlock is completed', async () => {
    rentals.unlockStatus.mockResolvedValue({
      payment_status: 'completed',
      owner_phone: '0755000111',
      owner_name: 'Landlord Jane',
      message: 'Contact unlocked successfully.',
    })

    renderPropertyDetail({ id: 3, role: 'renter', full_name: 'Renter User' })

    expect(await screen.findByText('Contact Unlocked')).toBeInTheDocument()
    expect(screen.getByText('0755000111')).toBeInTheDocument()
    expect(screen.getByText('Owner: Landlord Jane')).toBeInTheDocument()
  })

  it('shows unlock API errors for authenticated users', async () => {
    rentals.unlockStatus.mockRejectedValue(new Error('Unlock not found'))
    rentals.unlock.mockRejectedValueOnce(new Error('Email is required before unlocking contact details.'))

    renderPropertyDetail({ id: 3, role: 'renter', full_name: 'Renter User' })

    expect(await screen.findByRole('button', { name: 'Unlock Contact — TZS 5,000' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Contact — TZS 5,000' }))

    expect(await screen.findByText('Email is required before unlocking contact details.')).toBeInTheDocument()
  })
})
