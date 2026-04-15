import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api', () => ({
  properties: {
    create: vi.fn(),
  },
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import CreateProperty from './CreateProperty'
import { useAuth } from '../context/useAuth'
import { properties as propApi } from '../services/api'

function renderCreateProperty(user) {
  useAuth.mockReturnValue({ user })
  return render(
    <MemoryRouter>
      <CreateProperty />
    </MemoryRouter>,
  )
}

describe('CreateProperty landlord flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    propApi.create.mockReset()
  })

  it('requires landlord or admin access', async () => {
    renderCreateProperty({ id: 1, role: 'renter', full_name: 'Renter User' })

    expect(screen.getByText('Landlord access required')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register as landlord' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'List Property' })).not.toBeInTheDocument()
  })

  it('submits a normalized property payload and navigates to the new listing', async () => {
    propApi.create.mockResolvedValue({ id: 88 })
    renderCreateProperty({ id: 2, role: 'landlord', full_name: 'Landlord User' })

    fireEvent.change(screen.getByPlaceholderText('e.g. 2BR Modern Apartment in Kinondoni'), { target: { value: 'Modern Apartment' } })
    fireEvent.change(screen.getByPlaceholderText('Describe your property...'), { target: { value: 'Bright and spacious apartment.' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Msasani'), { target: { value: 'Msasani' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Old Bagamoyo Road'), { target: { value: 'Old Bagamoyo Road' } })
    fireEvent.change(screen.getByPlaceholderText('500000'), { target: { value: '500000' } })
    fireEvent.change(screen.getByPlaceholderText('Same as rent'), { target: { value: '500000' } })
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '3' } })

    const checkbox = screen.getByLabelText('Security')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: 'List Property' }))

    await waitFor(() => {
      expect(propApi.create).toHaveBeenCalledWith({
        title: 'Modern Apartment',
        description: 'Bright and spacious apartment.',
        property_type: 'apartment',
        district: 'Kinondoni',
        ward: 'Msasani',
        street: 'Old Bagamoyo Road',
        bedrooms: 3,
        bathrooms: 1,
        rent_amount: 500000,
        deposit_amount: 500000,
        furnished: false,
        has_water: true,
        has_electricity: true,
        has_parking: false,
        has_security: true,
      })
    })

    expect(mockNavigate).toHaveBeenCalledWith('/properties/88')
  })

  it('shows API submission errors and resets the loading state', async () => {
    propApi.create.mockRejectedValueOnce(new Error('Unable to create property right now.'))
    renderCreateProperty({ id: 2, role: 'landlord', full_name: 'Landlord User' })

    fireEvent.change(screen.getByPlaceholderText('e.g. 2BR Modern Apartment in Kinondoni'), { target: { value: 'Modern Apartment' } })
    fireEvent.change(screen.getByPlaceholderText('Describe your property...'), { target: { value: 'Bright and spacious apartment.' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Msasani'), { target: { value: 'Msasani' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Old Bagamoyo Road'), { target: { value: 'Old Bagamoyo Road' } })
    fireEvent.change(screen.getByPlaceholderText('500000'), { target: { value: '500000' } })

    fireEvent.click(screen.getByRole('button', { name: 'List Property' }))

    expect(await screen.findByText('Unable to create property right now.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List Property' })).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
