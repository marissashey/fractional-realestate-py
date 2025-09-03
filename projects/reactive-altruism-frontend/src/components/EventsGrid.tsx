import { useState } from 'react'

interface Event {
  id: string
  description: string
  oracle: string
  status: 'pending' | 'resolved'
  resolution?: boolean
  createdAt: string
}

export default function EventsGrid() {
  // Mock data for now - will be replaced with real contract data
  const [events] = useState<Event[]>([
    {
      id: "1701234567890",
      description: "Hurricane hits Miami by December 31, 2024",
      oracle: "ORACLE1234...ABCD",
      status: 'pending',
      createdAt: "2024-01-15"
    },
    {
      id: "1701234567891", 
      description: "Ethereum price reaches $5000 by end of year",
      oracle: "ORACLE5678...EFGH",
      status: 'pending',
      createdAt: "2024-01-14"
    },
    {
      id: "1701234567892",
      description: "Climate bill passes US Senate by March 2025", 
      oracle: "ORACLE9012...IJKL",
      status: 'resolved',
      resolution: true,
      createdAt: "2024-01-10"
    }
  ])

  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all')

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.status === filter
  })

  const getStatusBadge = (event: Event) => {
    if (event.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      )
    } else {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          event.resolution 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {event.resolution ? '✅ True' : '❌ False'}
        </span>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Browse Events</h2>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-gray-600">No events found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {event.description}
                  </h3>
                  {getStatusBadge(event)}
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-gray-400">🆔</span>
                  <span className="font-mono text-xs">{event.id}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-gray-400">🔮</span>
                  <span className="font-mono text-xs">{event.oracle}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-gray-400">📅</span>
                  <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {event.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    🎯 Use for Conditional Donation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
