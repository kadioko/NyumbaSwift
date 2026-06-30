import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalFetch = globalThis.fetch

async function loadApiModule() {
  return import('./api.js')
}

describe('api request handling', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    localStorage.clear()
    globalThis.fetch = originalFetch
  })

  it('dispatches an auth-expired event for 401 responses when a token exists', async () => {
    localStorage.setItem('nyumbaswift_token', 'token-123')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid token' }),
    })

    const { auth } = await loadApiModule()

    await expect(auth.me()).rejects.toMatchObject({
      message: 'Invalid token',
      status: 401,
    })

    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    const event = dispatchSpy.mock.calls[0][0]
    expect(event.type).toBe('nyumbaswift:auth-expired')
    expect(event.detail).toEqual({ message: 'Your session expired. Please sign in again.' })
  })

  it('does not dispatch auth-expired when no token exists', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid token' }),
    })

    const { auth } = await loadApiModule()

    await expect(auth.me()).rejects.toMatchObject({ status: 401 })
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('wraps network failures in a friendly api error', async () => {
    globalThis.fetch.mockRejectedValue(new Error('socket hang up'))

    const { auth } = await loadApiModule()

    await expect(auth.me()).rejects.toMatchObject({
      message: 'Network error. Please check your connection and try again.',
      status: 0,
    })
  })

  it('supports an absolute backend base url from VITE_API_BASE_URL', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    })

    const previous = import.meta.env.VITE_API_BASE_URL
    import.meta.env.VITE_API_BASE_URL = 'https://nyumbaswift-production.up.railway.app'

    vi.resetModules()
    const { wallet } = await loadApiModule()
    await wallet.get()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://nyumbaswift-production.up.railway.app/api/v1/wallet/',
      expect.any(Object),
    )

    import.meta.env.VITE_API_BASE_URL = previous
    vi.resetModules()
  })
})
