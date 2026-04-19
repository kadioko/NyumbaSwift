import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  rentals: {
    my: vi.fn(),
    paymentHistory: vi.fn(),
    pay: vi.fn(),
    confirmPayment: vi.fn(),
  },
}))

import MyRentals from './MyRentals'
import { rentals as rentalApi } from '../services/api'

const rental = {
  id: 44,
  status: 'active',
  monthly_rent: 450000,
  start_date: '2026-01-01T00:00:00Z',
}

const paymentRequest = {
  id: 99,
  amount: 450000,
  platform_fee: 22500,
  landlord_payout: 427500,
}

function openPayRentTab() {
  fireEvent.click(screen.getByRole('button', { name: 'pay rent' }))
}

describe('MyRentals payment UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rentalApi.my.mockResolvedValue([rental])
    rentalApi.paymentHistory.mockResolvedValue([])
    rentalApi.pay.mockResolvedValue(paymentRequest)
    rentalApi.confirmPayment.mockResolvedValue({ ok: true })
  })

  it('initiates payment and switches to confirmation mode', async () => {
    render(<MyRentals />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'pay rent' })).toBeInTheDocument()
    })

    openPayRentTab()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '44' } })
    fireEvent.click(screen.getByRole('button', { name: 'Initiate Payment' }))

    await waitFor(() => {
      expect(rentalApi.pay).toHaveBeenCalledWith({
        rental_id: 44,
        payment_month: expect.stringMatching(/^\d{4}-\d{2}$/),
      })
    })

    expect(await screen.findByText('Payment Initiated')).toBeInTheDocument()
    expect(screen.getByText('Payment request created. Complete the nTZS mobile money prompt, then confirm the payment reference below if needed.')).toBeInTheDocument()
  })

  it('shows confirmation errors without leaving the confirmation step', async () => {
    rentalApi.confirmPayment.mockRejectedValueOnce(new Error('Payment confirmation failed.'))
    render(<MyRentals />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'pay rent' })).toBeInTheDocument()
    })

    openPayRentTab()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '44' } })
    fireEvent.click(screen.getByRole('button', { name: 'Initiate Payment' }))

    expect(await screen.findByText('Payment Initiated')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Payment Reference'), { target: { value: 'abc123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment' }))

    expect(await screen.findByText('Payment confirmation failed.')).toBeInTheDocument()
    expect(screen.getByText('Payment Initiated')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument()
  })

  it('refreshes rental data after successful payment confirmation', async () => {
    rentalApi.paymentHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, amount: 450000, payment_month: '2026-04', mpesa_reference: 'ABC123', status: 'completed' }])

    render(<MyRentals />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'pay rent' })).toBeInTheDocument()
    })

    openPayRentTab()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '44' } })
    fireEvent.click(screen.getByRole('button', { name: 'Initiate Payment' }))

    expect(await screen.findByText('Payment Initiated')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Payment Reference'), { target: { value: 'abc123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment' }))

    await waitFor(() => {
      expect(rentalApi.confirmPayment).toHaveBeenCalledWith(99, 'ABC123')
    })

    expect(await screen.findByText('Payment confirmed successfully and your history has been updated.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Initiate Payment' })).toBeInTheDocument()
    expect(rentalApi.my).toHaveBeenCalledTimes(2)
    expect(rentalApi.paymentHistory).toHaveBeenCalledTimes(2)
  })
})
