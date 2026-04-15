import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

import Login from './Login'
import { useAuth } from '../context/useAuth'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLogin(authState, initialEntries = ['/login']) {
  useAuth.mockReturnValue(authState)
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Login session notice UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the auth notice from context', () => {
    renderLogin({
      login: vi.fn(),
      authNotice: 'Your session expired. Please sign in again.',
      clearAuthNotice: vi.fn(),
    })

    expect(screen.getByText('Your session expired. Please sign in again.')).toBeInTheDocument()
  })

  it('clears the auth notice before submitting login', async () => {
    const clearAuthNotice = vi.fn()
    const login = vi.fn().mockResolvedValue({ user: { role: 'renter' } })

    renderLogin({
      login,
      authNotice: 'Your session expired. Please sign in again.',
      clearAuthNotice,
    })

    fireEvent.change(screen.getByPlaceholderText('0712345678'), { target: { value: '0712345678' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ phone: '0712345678', password: 'secret123' })
    })

    expect(clearAuthNotice).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/properties', { replace: true })
  })

  it('clears the auth notice when the page unmounts', () => {
    const clearAuthNotice = vi.fn()

    const { unmount } = renderLogin({
      login: vi.fn(),
      authNotice: 'Your session expired. Please sign in again.',
      clearAuthNotice,
    })

    unmount()

    expect(clearAuthNotice).toHaveBeenCalledTimes(1)
  })
})
