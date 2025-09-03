import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'

export default function InstantDonationForm() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  
  const [recipientAddress, setRecipientAddress] = useState('')
  const [donationAmount, setDonationAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress) return

    setIsLoading(true)
    try {
      // TODO: Integrate with ResponsiveDonation contract
      enqueueSnackbar('Feature coming soon! Contract integration in progress.', { variant: 'info' })
    } catch (error) {
      console.error('Error making instant donation:', error)
      enqueueSnackbar('Failed to make donation. Please try again.', { variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const presetAmounts = [
    { label: '$10', algos: 10 },
    { label: '$25', algos: 25 },
    { label: '$50', algos: 50 },
    { label: '$100', algos: 100 },
  ]

  return (
    <div className="card p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Instant Donation</h2>
        <p className="text-gray-600">Make a direct donation with immediate transfer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Enter Algorand address"
            className="w-full px-3 py-2 border border-gray-300 focus:border-gray-900 focus:outline-none"
            required
          />
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
          
          <div className="flex gap-2 mt-3">
            {presetAmounts.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDonationAmount(preset.algos.toString())}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Your donation will be sent immediately to the recipient address.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !activeAddress}
          className="w-full btn-primary"
        >
          {isLoading ? 'Processing...' : 'Donate Now'}
        </button>
      </form>
    </div>
  )
}
