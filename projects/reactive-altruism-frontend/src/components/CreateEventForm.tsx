import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useAppClient } from '../context/AppClientContext'
import { useEvents } from '../hooks/useEvents'

export default function CreateEventForm() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { appClient } = useAppClient()
  const { createEvent, loading, error, success } = useEvents(appClient, activeAddress)

  const [eventString, setEventString] = useState('')
  const [oracleAddress, setOracleAddress] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !appClient) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    if (!eventString || !oracleAddress) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' })
      return
    }

    try {
      await createEvent(eventString, oracleAddress)
      if (success) {
        enqueueSnackbar(success, { variant: 'success' })
        // Clear form on success
        setEventString('')
        setOracleAddress('')
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  // Show error notifications
  if (error) {
    enqueueSnackbar(error, { variant: 'error' })
  }

  // Auto-fill oracle address with user's address if they want to be the oracle
  const handleUseMyAddress = () => {
    if (activeAddress) {
      setOracleAddress(activeAddress)
    }
  }

  const exampleEvents = [
    'Hurricane hits Miami by December 31, 2024',
    'Bitcoin price reaches $100,000 by end of 2024',
    'Charity fundraising goal of $50,000 is reached',
    'New climate legislation is passed by Congress',
    'Local sports team wins championship'
  ]

  return (
    <div className="card p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Event</h2>
        <p className="text-gray-600">Create an event that can be used for conditional donations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Event Description
          </label>
          <textarea
            value={eventString}
            onChange={(e) => setEventString(e.target.value)}
            placeholder="Describe the event (e.g., Hurricane hits Miami by Dec 31, 2024)"
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
            rows={3}
            required
          />
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Example events:</p>
            <div className="flex flex-wrap gap-2">
              {exampleEvents.slice(0, 3).map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setEventString(example)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  {example.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Oracle Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={oracleAddress}
              onChange={(e) => setOracleAddress(e.target.value)}
              placeholder="Address authorized to resolve this event"
              className="flex-1 px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={handleUseMyAddress}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Use My Address
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The oracle is responsible for determining if the event occurred
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Once created, only the specified oracle can resolve whether this event occurred.
            Choose the oracle address carefully.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !activeAddress || !appClient}
          className="w-full btn-primary"
        >
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}