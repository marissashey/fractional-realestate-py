import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'

export default function CreateEventForm() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  
  const [eventDescription, setEventDescription] = useState('')
  const [oracleAddress, setOracleAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress) return

    setIsLoading(true)
    try {
      // TODO: Integrate with ResponsiveDonation contract
      enqueueSnackbar('Feature coming soon! Contract integration in progress.', { variant: 'info' })
    } catch (error) {
      console.error('Error creating event:', error)
      enqueueSnackbar('Failed to create event. Please try again.', { variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const exampleEvents = [
    "Hurricane hits Miami by December 31, 2024",
    "Ethereum price reaches $5000 by end of year",
    "Climate bill passes US Senate by March 2025",
    "Local charity reaches $100k fundraising goal",
    "Team wins championship this season"
  ]

  return (
    <div className="card p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Event</h2>
        <p className="text-gray-600">Define events for conditional donations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Event Description
          </label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Describe the event with specific conditions and dates"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about conditions, dates, and measurable outcomes
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Oracle Address
          </label>
          <input
            type="text"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
            placeholder="Address authorized to resolve this event"
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This address will resolve the event as true/false
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4">
          <p className="font-medium text-gray-900 mb-2">Example Events:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {exampleEvents.map((example, index) => (
              <li key={index}>• {example}</li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading || !activeAddress}
          className="w-full btn-primary"
        >
          {isLoading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}
