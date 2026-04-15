import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

vi.mock('../services/api', () => ({
  auth: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}))

import { auth as authApi } from '../services/api'

function AuthProbe() {
  const { user, token, loading, authNotice } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.full_name : 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      <div data-testid="notice">{authNotice || 'none'}</div>
    </div>
  )
}

describe('AuthProvider session expiry handling', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    authApi.me.mockResolvedValue({ full_name: 'Existing User', role: 'renter' })
    authApi.login.mockReset()
    authApi.register.mockReset()
  })

  it('logs the user out and shows the expiry notice when the auth-expired event fires', async () => {
    localStorage.setItem('nyumbaswift_token', 'stored-token')
    authApi.me.mockImplementationOnce(() => new Promise(() => {}))

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    window.dispatchEvent(new CustomEvent('nyumbaswift:auth-expired', {
      detail: { message: 'Session timed out on another device.' },
    }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('none')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('loading')).toHaveTextContent('no')
    expect(screen.getByTestId('notice')).toHaveTextContent('Session timed out on another device.')
    expect(localStorage.getItem('nyumbaswift_token')).toBeNull()
  })

  it('shows the default expiry notice after a stored token fails with 401', async () => {
    localStorage.setItem('nyumbaswift_token', 'expired-token')
    authApi.me.mockRejectedValueOnce({ status: 401 })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('no')
    })

    expect(screen.getByTestId('notice')).toHaveTextContent('Your session expired. Please sign in again.')
    expect(screen.getByTestId('token')).toHaveTextContent('none')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(localStorage.getItem('nyumbaswift_token')).toBeNull()
  })
})
