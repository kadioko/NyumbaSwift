import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}))

vi.mock('./components/Footer', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('./pages/Landing', () => ({ default: () => <div>Landing Page</div> }))
vi.mock('./pages/Login', () => ({ default: () => <div>Login Page</div> }))
vi.mock('./pages/Register', () => ({ default: () => <div>Register Page</div> }))
vi.mock('./pages/Properties', () => ({ default: () => <div>Properties Page</div> }))
vi.mock('./pages/PropertyDetail', () => ({ default: () => <div>Property Detail Page</div> }))
vi.mock('./pages/CreateProperty', () => ({ default: () => <div>Create Property Page</div> }))
vi.mock('./pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('./pages/MyRentals', () => ({ default: () => <div>My Rentals Page</div> }))
vi.mock('./pages/Agents', () => ({ default: () => <div>Agents Page</div> }))
vi.mock('./pages/AgentApply', () => ({ default: () => <div>Agent Apply Page</div> }))
vi.mock('./pages/Profile', () => ({ default: () => <div>Profile Page</div> }))
vi.mock('./pages/AboutNyumbaSwift', () => ({ default: () => <div>About Page</div> }))
vi.mock('./pages/BecomeAgentInfo', () => ({ default: () => <div>Become Agent Page</div> }))
vi.mock('./pages/TermsConditions', () => ({ default: () => <div>Terms Page</div> }))
vi.mock('./pages/PrivacyPolicy', () => ({ default: () => <div>Privacy Page</div> }))

import App from './App'
import { useAuth } from './context/useAuth'

function renderApp(authState, initialEntries) {
  useAuth.mockReturnValue(authState)
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  )
}

describe('App route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    renderApp({ user: null, loading: false }, ['/profile'])

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
  })

  it('redirects authenticated renters away from landlord-only routes', async () => {
    renderApp({ user: { role: 'renter', full_name: 'Renter User' }, loading: false }, ['/dashboard'])

    await waitFor(() => {
      expect(screen.getByText('Properties Page')).toBeInTheDocument()
    })
  })

  it('redirects authenticated landlords away from guest-only routes', async () => {
    renderApp({ user: { role: 'landlord', full_name: 'Landlord User' }, loading: false }, ['/login'])

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
    })
  })

  it('shows a loading state while auth is resolving', () => {
    renderApp({ user: null, loading: true }, ['/profile'])

    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })
})
