import { useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useAppClient } from '../context/AppClientContext'
import { useClauses } from '../hooks/useClauses'
import { useEvents } from '../hooks/useEvents'
import { ellipseAddress } from '../utils/ellipseAddress'

export default function DonationHistory() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { appClient } = useAppClient()
  const { clauses, fetchClauses, executeConditionalClause, getClausesForDonor, loading: clausesLoading, error: clausesError } = useClauses(appClient, activeAddress)
  const { events, fetchEvents, loading: eventsLoading, error: eventsError } = useEvents(appClient, activeAddress)

  useEffect(() => {
    if (appClient && activeAddress) {
      fetchClauses()
      fetchEvents()
    }
  }, [appClient, activeAddress, fetchClauses, fetchEvents])

  // Show error notifications
  if (clausesError) {
    enqueueSnackbar(clausesError, { variant: 'error' })
  }
  if (eventsError) {
    enqueueSnackbar(eventsError, { variant: 'error' })
  }

  if (!activeAddress) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600">Connect your wallet to view donation history</p>
      </div>
    )
  }

  const userClauses = activeAddress ? getClausesForDonor(activeAddress) : []
  const eventsMap = new Map(events.map(([id, event]) => [id.toString(), event]))

  const handleExecuteClause = async (clauseId: string) => {
    try {
      await executeConditionalClause(clauseId)
    } catch (error) {
      console.error('Error executing clause:', error)
    }
  }

  const getClauseStatus = (clause: any) => {
    const event = eventsMap.get(clause.eventId.toString())
    if (!event) return { status: 'unknown', canExecute: false }
    
    if (event.pending) {
      return { status: 'waiting', canExecute: false }
    } else if (clause.executed) {
      return { status: 'executed', canExecute: false }
    } else {
      return { status: 'ready', canExecute: true }
    }
  }

  // Calculate stats
  const totalDonated = userClauses
    .filter(([_, clause]) => clause.executed)
    .reduce((sum, [_, clause]) => sum + Number(clause.payoutAmount) / 1_000_000, 0)

  const pendingAmount = userClauses
    .filter(([_, clause]) => !clause.executed)
    .reduce((sum, [_, clause]) => sum + Number(clause.payoutAmount) / 1_000_000, 0)

  if (clausesLoading || eventsLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your donations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Donation History</h2>
        <button
          onClick={() => {
            fetchClauses()
            fetchEvents()
          }}
          className="btn-secondary"
          disabled={clausesLoading || eventsLoading}
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalDonated.toFixed(3)}</div>
          <div className="text-sm text-gray-600">ALGO Donated</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{pendingAmount.toFixed(3)}</div>
          <div className="text-sm text-gray-600">ALGO Pending</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{userClauses.length}</div>
          <div className="text-sm text-gray-600">Total Donations</div>
        </div>
      </div>
      
      {userClauses.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600">No conditional donations yet</p>
          <p className="text-sm text-gray-500 mt-2">Your conditional donation history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userClauses.map(([clauseId, clause]) => {
            const event = eventsMap.get(clause.eventId.toString())
            const { status, canExecute } = getClauseStatus(clause)
            
            return (
              <div key={clauseId.toString()} className="card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        🎯 Conditional
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        status === 'executed' 
                          ? 'bg-green-100 text-green-800'
                          : status === 'ready'
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'executed' ? '✅ Executed' : 
                         status === 'ready' ? '🚀 Ready to Execute' : '⏳ Waiting for Event'}
                      </span>
                    </div>
                    
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {(Number(clause.payoutAmount) / 1_000_000).toFixed(3)} ALGO
                    </div>
                    
                    <div className="text-gray-600 space-y-1">
                      <p className="mb-1">
                        <span className="font-medium">Event:</span> {event?.eventString || 'Unknown Event'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">If true →</span> {ellipseAddress(clause.recipientYes)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">If false →</span> {ellipseAddress(clause.recipientNo)}
                      </p>
                      {event && !event.pending && (
                        <p className="text-sm font-medium">
                          <span className="font-medium">Event resolved:</span>{' '}
                          <span className={event.resolution ? 'text-green-600' : 'text-red-600'}>
                            {event.resolution ? 'True' : 'False'}
                          </span>
                        </p>
                      )}
                    </div>
                    
                    {canExecute && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleExecuteClause(clauseId.toString())}
                          className="btn-primary"
                          disabled={clausesLoading}
                        >
                          Execute Donation
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Clause ID: {clauseId.toString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}