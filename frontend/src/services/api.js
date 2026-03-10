const API_BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('nyumbaswift_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = data?.detail || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

// Auth
export const auth = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  verify: (body) => request('/auth/verify', { method: 'POST', body: JSON.stringify(body) }),
}

// Properties
export const properties = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString()
    return request(`/properties/${qs ? '?' + qs : ''}`)
  },
  get: (id) => request(`/properties/${id}`),
  create: (body) => request('/properties/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  verifyProp: (id) => request(`/properties/${id}/verify`, { method: 'POST' }),
  boost: (id) => request(`/properties/${id}/boost`, { method: 'POST' }),
}

// Rentals & Payments
export const rentals = {
  create: (body) => request('/rentals/', { method: 'POST', body: JSON.stringify(body) }),
  my: () => request('/rentals/my'),
  end: (id) => request(`/rentals/${id}/end`, { method: 'POST' }),
  pay: (body) => request('/rentals/payments', { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (id, ref) => request(`/rentals/payments/${id}/confirm?mpesa_reference=${ref}`, { method: 'POST' }),
  paymentHistory: () => request('/rentals/payments/history'),
  unlock: (body) => request('/rentals/unlock', { method: 'POST', body: JSON.stringify(body) }),
  unlockStatus: (propertyId) => request(`/rentals/unlock/${propertyId}`),
}

// Agents
export const agents = {
  apply: (body) => request('/agents/apply', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/agents/me'),
  list: () => request('/agents/'),
  pending: () => request('/agents/pending'),
  review: (id, body) => request(`/agents/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
}

// Dashboard
export const dashboard = {
  landlordSummary: () => request('/dashboard/landlord/summary'),
  landlordProperties: () => request('/dashboard/landlord/properties'),
  platformStats: () => request('/dashboard/admin/platform-stats'),
}
