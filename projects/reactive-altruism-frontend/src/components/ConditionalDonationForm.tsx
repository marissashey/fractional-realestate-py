import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useAppClient } from '../context/AppClientContext'
import { useConditionalDonation } from '../hooks/useConditionalDonation'

export default function ConditionalDonationForm() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { appClient } = useAppClient()
  const { createConditionalDonation, loading: donationLoading, error, success } = useConditionalDonation(appClient, activeAddress)
  
  const [eventId, setEventId] = useState('')
  const [recipientYes, setRecipientYes] = useState('')
  const [recipientNo, setRecipientNo] = useState('')
  const [donationAmount, setDonationAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !appClient) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    if (!eventId || !recipientYes || !recipientNo || !donationAmount) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' })
      return
    }

    await createConditionalDonation(eventId, recipientYes, recipientNo, donationAmount)
  }

  // Show success notifications
  React.useEffect(() => {
    if (success) {
      enqueueSnackbar(success, { variant: 'success' })
      // Clear form on success
      setEventId('')
      setRecipientYes('')
      setRecipientNo('')
      setDonationAmount('')
    }
  }, [success, enqueueSnackbar])

  // Show error notifications
  React.useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' })
    }
  }, [error, enqueueSnackbar])

  // Auto-fill recipient_no with user's address if empty
  const handleRecipientNoFocus = () => {
    if (!recipientNo && activeAddress) {
      setRecipientNo(activeAddress)
    }
  }

  return (
    <div className="card p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Conditional Donation</h2>
        <p className="text-gray-600">Create a donation that activates based on real-world events</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Event ID
          </label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Enter event ID"
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Find available events in the Oracle tab
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Amount (ALGO)
          </label>
          <input
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="0.00"
            min="0.001"
            step="0.001"
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              If event occurs
            </label>
            <input
              type="text"
              value={recipientYes}
              onChange={(e) => setRecipientYes(e.target.value)}
              placeholder="Charity address"
              className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Funds go here if event happens</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              If event doesn't occur
            </label>
            <input
              type="text"
              value={recipientNo}
              onChange={(e) => setRecipientNo(e.target.value)}
              onFocus={handleRecipientNoFocus}
              placeholder="Your address (auto-filled)"
              className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Funds returned here if event doesn't happen</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <strong>Example:</strong> Donate $100 to Red Cross if hurricane hits Miami by Dec 31, otherwise return to me
          </p>
        </div>

        <button
          type="submit"
          disabled={donationLoading || !activeAddress || !appClient}
          className="w-full btn-primary"
        >
          {donationLoading ? 'Creating...' : 'Create Conditional Donation'}
        </button>
      </form>
    </div>
  )
}
