import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api', () => ({
  properties: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

const mockParams = { id: '17' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockParams,
  }
})

import EditProperty from './EditProperty'
import { useAuth } from '../context/useAuth'
import { properties as propApi } from '../services/api'

const verifiedProperty = {
  id: 17,
  owner_id: 2,
  title: 'Garden Flat',
  description: 'Quiet and bright flat.',
  property_type: 'apartment',
  status: 'active',
  district: 'Kinondoni',
  ward: 'Msasani',
  street: 'Chole Road',
  latitude: null,
  longitude: null,
  bedrooms: 2,
  bathrooms: 1,
  size_sqm: null,
  furnished: false,
  has_water: true,
  has_electricity: true,
  has_parking: false,
  has_security: true,
  rent_amount: 650000,
  deposit_amount: 650000,
  is_premium: false,
  is_verified: true,
  created_at: '2026-04-01T00:00:00Z',
  photos: [],
}

function renderEditProperty(user = { id: 2, role: 'landlord', full_name: 'Landlord User' }) {
  useAuth.mockReturnValue({ user })
  return render(
    <MemoryRouter>
      <EditProperty />
    </MemoryRouter>,
  )
}

describe('EditProperty landlord flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    propApi.get.mockResolvedValue(verifiedProperty)
    propApi.update.mockReset()
  })

  it('shows a verification reset warning for verified properties', async () => {
    renderEditProperty()

    expect(await screen.findByText('Edit Property')).toBeInTheDocument()
    expect(screen.getByText(/Changing listing details will send this property back to pending verification/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Garden Flat')).toBeInTheDocument()
  })

  it('submits edits successfully and surfaces the pending verification reset state', async () => {
    propApi.update.mockResolvedValue({
      ...verifiedProperty,
      title: 'Updated Garden Flat',
      status: 'pending_verification',
      is_verified: false,
      rent_amount: 700000,
    })

    renderEditProperty()

    await screen.findByDisplayValue('Garden Flat')

    fireEvent.change(screen.getByDisplayValue('Garden Flat'), { target: { value: 'Updated Garden Flat' } })
    fireEvent.change(screen.getByDisplayValue('650000'), { target: { value: '700000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(propApi.update).toHaveBeenCalledWith(17, {
        title: 'Updated Garden Flat',
        description: 'Quiet and bright flat.',
        bedrooms: 2,
        bathrooms: 1,
        rent_amount: 700000,
        furnished: false,
        status: 'active',
      })
    })

    expect(await screen.findByText('Property updated successfully. Your listing is now pending verification again because you changed listing details.')).toBeInTheDocument()
    expect(screen.getByText('pending verification')).toBeInTheDocument()
    expect(screen.getByText('Unverified')).toBeInTheDocument()
  })

  it('shows update API errors and keeps the form visible', async () => {
    propApi.update.mockRejectedValueOnce(new Error('Unable to update property right now.'))
    renderEditProperty()

    await screen.findByDisplayValue('Garden Flat')

    fireEvent.change(screen.getByDisplayValue('Garden Flat'), { target: { value: 'Updated Garden Flat' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Unable to update property right now.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Updated Garden Flat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })
})
