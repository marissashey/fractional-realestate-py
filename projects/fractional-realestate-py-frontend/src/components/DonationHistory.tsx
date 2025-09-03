import { useState } from 'react'

interface DonationRecord {
  id: string
  type: 'instant' | 'conditional'
  amount: number
  recipient: string
  status: 'completed' | 'pending' | 'cancelled'
  date: string
  eventDescription?: string
  eventResolution?: boolean
}

export default function DonationHistory() {
  // Mock data for now - will be replaced with real contract data
  const [donations] = useState<DonationRecord[]>([
    {
      id: "txn_001",
      type: 'instant',
      amount: 50,
      recipient: "CHARITY123...ABCD",
      status: 'completed',
      date: "2024-01-20"
    },
    {
      id: "txn_002", 
      type: 'conditional',
      amount: 100,
      recipient: "REDCROSS456...EFGH",
      status: 'pending',
      date: "2024-01-18",
      eventDescription: "Hurricane hits Miami by December 31, 2024"
    },
    {
      id: "txn_003",
      type: 'conditional',
      amount: 25,
      recipient: "CLIMATE789...IJKL", 
      status: 'completed',
      date: "2024-01-15",
      eventDescription: "Climate bill passes US Senate by March 2025",
      eventResolution: true
    }
  ])

  const [filter, setFilter] = useState<'all' | 'instant' | 'conditional'>('all')

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true
    return donation.type === filter
  })

  const getStatusBadge = (donation: DonationRecord) => {
    switch (donation.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Completed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ❌ Cancelled
          </span>
        )
    }
  }

  const getTypeIcon = (type: 'instant' | 'conditional') => {
    return type === 'instant' ? '💰' : '🎯'
  }

  const totalDonated = donations
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0)

  const pendingAmount = donations
    .filter(d => d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Donation History</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-gray-900 border-b border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('instant')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'instant'
                ? 'text-gray-900 border-b border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Instant
          </button>
          <button
            onClick={() => setFilter('conditional')}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'conditional'
                ? 'text-gray-900 border-b border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Conditional
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalDonated}</div>
          <div className="text-sm text-gray-600">ALGO Donated</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{pendingAmount}</div>
          <div className="text-sm text-gray-600">ALGO Pending</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{donations.length}</div>
          <div className="text-sm text-gray-600">Total Donations</div>
        </div>
      </div>

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No donations found</p>
          <p className="text-gray-500 text-sm mt-1">Start donating to see your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDonations.map((donation) => (
            <div key={donation.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {donation.type} Donation
                    </h3>
                    {getStatusBadge(donation)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Amount:</strong> {donation.amount} ALGO</p>
                    <p><strong>Recipient:</strong> <span className="font-mono text-xs">{donation.recipient}</span></p>
                    <p><strong>Date:</strong> {new Date(donation.date).toLocaleDateString()}</p>
                    
                    {donation.eventDescription && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200">
                        <p className="text-gray-700 text-sm">
                          <strong>Event:</strong> {donation.eventDescription}
                        </p>
                        {donation.eventResolution !== undefined && (
                          <p className="text-xs mt-1">
                            <strong>Result:</strong> {donation.eventResolution ? 'True' : 'False'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
