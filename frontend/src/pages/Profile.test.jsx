import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api', () => ({
  auth: {
    verify: vi.fn(),
    updateMe: vi.fn(),
  },
}))

import Profile from './Profile'
import { useAuth } from '../context/useAuth'
import { auth as authApi } from '../services/api'

const baseUser = {
  id: 55,
  full_name: 'Jane Renter',
  email: 'jane@example.com',
  phone: '0712345678',
  role: 'renter',
  verification_status: 'unverified',
  national_id: '',
  profile_photo_url: '',
}

function renderProfile(overrides = {}) {
  const setUser = vi.fn()
  useAuth.mockReturnValue({
    user: { ...baseUser, ...overrides },
    setUser,
  })

  const view = render(<Profile />)
  return { setUser, ...view }
}

describe('Profile verification UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authApi.verify.mockReset()
    authApi.updateMe.mockReset()
  })

  it('rejects oversized National ID uploads on the client', async () => {
    renderProfile()

    const fileInput = document.querySelector('input[type="file"]')
    const oversizedFile = new File(['x'], 'national-id.png', { type: 'image/png' })
    Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 })

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    expect(await screen.findByText('National ID image must be 5MB or smaller.')).toBeInTheDocument()
    expect(screen.queryByAltText('National ID preview')).not.toBeInTheDocument()
  })

  it('renders the pending verification review state', () => {
    renderProfile({
      verification_status: 'pending',
      national_id: '12345678',
      profile_photo_url: 'data:image/png;base64,pending',
    })

    expect(screen.getByText('Verification Pending Review')).toBeInTheDocument()
    expect(screen.getByText(/An admin will review them and verify your account/i)).toBeInTheDocument()
    expect(screen.getByAltText('Submitted National ID')).toBeInTheDocument()
    expect(screen.queryByText('Verify Your Identity')).not.toBeInTheDocument()
  })

  it('submits verification successfully and updates auth state', async () => {
    const updatedUser = {
      ...baseUser,
      verification_status: 'pending',
      national_id: '12345678',
      profile_photo_url: 'data:image/png;base64,updated',
    }
    authApi.verify.mockResolvedValue(updatedUser)
    const { setUser } = renderProfile({ profile_photo_url: 'data:image/png;base64,current' })

    fireEvent.change(screen.getByPlaceholderText('National ID number'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Verification' }))

    await waitFor(() => {
      expect(authApi.verify).toHaveBeenCalledWith({
        national_id: '12345678',
        profile_photo_url: 'data:image/png;base64,current',
      })
    })

    expect(setUser).toHaveBeenCalledWith(updatedUser)
    expect(await screen.findByText('Verification submitted')).toBeInTheDocument()
  })

  it('shows verification API errors without clearing the form', async () => {
    authApi.verify.mockRejectedValueOnce(new Error('Verification service unavailable.'))
    renderProfile({ profile_photo_url: 'data:image/png;base64,current' })

    fireEvent.change(screen.getByPlaceholderText('National ID number'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Verification' }))

    expect(await screen.findByText('Verification service unavailable.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12345678')).toBeInTheDocument()
  })
})
