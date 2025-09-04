import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useAppClient } from '../context/AppClientContext'
import { useEvents } from '../hooks/useEvents'
import { getApplicationAddress } from 'algosdk'

export default function CreateEventForm() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { appClient } = useAppClient()
  const { createEvent, loading, error, success } = useEvents(appClient, activeAddress)

  const [eventString, setEventString] = useState('')
  const [oracleAddress, setOracleAddress] = useState('')
  const [oracleType, setOracleType] = useState<'centralized' | 'decentralized'>('centralized')

  // Get EventOracle app ID from environment (for decentralized option)
  const eventOracleAppId = import.meta.env.VITE_EVENT_ORACLE_APP_ID

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress || !appClient) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    if (!eventString) {
      enqueueSnackbar('Please enter an event description', { variant: 'warning' })
      return
    }

    // Determine the oracle address based on user's choice
    let finalOracleAddress = ''
    if (oracleType === 'centralized') {
      if (!oracleAddress) {
        enqueueSnackbar('Please enter an oracle address or select decentralized option', { variant: 'warning' })
        return
      }
      finalOracleAddress = oracleAddress
    } else {
      // Decentralized: use EventOracle contract address
      if (!eventOracleAppId) {
        enqueueSnackbar('EventOracle not deployed. Please use centralized option or deploy EventOracle first.', { variant: 'warning' })
        return
      }
      // Derive the contract address from the app ID
      try {
        finalOracleAddress = getApplicationAddress(parseInt(eventOracleAppId)).toString()
      } catch (error) {
        enqueueSnackbar('Invalid EventOracle App ID. Please check your configuration.', { variant: 'error' })
        return
      }
    }

    try {
      await createEvent(eventString, finalOracleAddress)
      if (success) {
        const oracleTypeText = oracleType === 'centralized' ? 'centralized oracle' : 'decentralized EventOracle'
        enqueueSnackbar(`${success} Using ${oracleTypeText}.`, { variant: 'success' })
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
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Oracle Resolution Method
          </label>
          
          {/* Oracle Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                oracleType === 'centralized' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setOracleType('centralized')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="oracleType"
                  value="centralized"
                  checked={oracleType === 'centralized'}
                  onChange={(e) => setOracleType(e.target.value as 'centralized')}
                  className="mt-1 mr-3"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">👤 Centralized Oracle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    A specific address (yours or someone else's) resolves the event manually
                  </p>
                  <p className="text-xs text-green-600 mt-1">✅ Simple, fast, recommended for demos</p>
                </div>
              </div>
            </div>

            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                oracleType === 'decentralized' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setOracleType('decentralized')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="oracleType"
                  value="decentralized"
                  checked={oracleType === 'decentralized'}
                  onChange={(e) => setOracleType(e.target.value as 'decentralized')}
                  className="mt-1 mr-3"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">🗳️ Decentralized Oracle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    EventOracle contract with token-weighted voting and disputes
                  </p>
                  <p className="text-xs text-purple-600 mt-1">⚡ Advanced, trustless, community-driven</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Oracle Address Input */}
          {oracleType === 'centralized' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oracle Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={oracleAddress}
                  onChange={(e) => setOracleAddress(e.target.value)}
                  placeholder="Address authorized to resolve this event"
                  className="flex-1 px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
                  required={oracleType === 'centralized'}
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
                This address will be able to manually resolve the event outcome
              </p>
            </div>
          )}

          {/* Decentralized Oracle Info */}
          {oracleType === 'decentralized' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">🤖 EventOracle Integration</h4>
              <div className="text-sm text-purple-800 space-y-1">
                <p>• Events resolved through token-weighted voting</p>
                <p>• Dispute mechanisms with economic incentives</p>
                <p>• Automatic resolution triggers conditional donations</p>
                {eventOracleAppId && (
                  <p className="mt-2">
                    <span className="font-medium">EventOracle App ID:</span> {eventOracleAppId}
                  </p>
                )}
                {!eventOracleAppId && (
                  <p className="text-purple-700 bg-purple-100 p-2 rounded mt-2">
                    ⚠️ EventOracle not deployed. Please deploy it first or use centralized option.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Once created, the resolution method cannot be changed. 
            {oracleType === 'centralized' 
              ? 'Only your specified oracle address can resolve this event.'
              : 'The event will be resolved through the decentralized EventOracle voting process.'
            }
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