import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEventOracleClient } from '../context/EventOracleClientContext'
import ConnectWallet from '../components/ConnectWallet'
import { microAlgo } from '@algorandfoundation/algokit-utils'

export default function EventOracleTestPage() {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { eventOracleClient, error: clientError, isContractBuilt } = useEventOracleClient()
  
  // Form states (ResponsiveDonation App ID is required for all operations)
  const [responsiveDonationAppId, setResponsiveDonationAppId] = useState('')
  const [proposalEventId, setProposalEventId] = useState('')
  const [proposalOutcome, setProposalOutcome] = useState<boolean>(true)
  const [proposalStake, setProposalStake] = useState('10')
  const [disputeEventId, setDisputeEventId] = useState('')
  const [disputeOutcome, setDisputeOutcome] = useState<boolean>(false)
  const [disputeStake, setDisputeStake] = useState('20')
  const [voteEventId, setVoteEventId] = useState('')
  const [voteOutcome, setVoteOutcome] = useState<boolean>(true)
  const [voteStake, setVoteStake] = useState('5')
  const [queryEventId, setQueryEventId] = useState('')
  const [resolveEventId, setResolveEventId] = useState('')
  const [expediteEventId, setExpediteEventId] = useState('')
  const [expediteOutcome, setExpediteOutcome] = useState<boolean>(true)
  const [claimEventId, setClaimEventId] = useState('')
  
  // Integration states
  const [integrationEventId, setIntegrationEventId] = useState('')
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [eventInfo, setEventInfo] = useState<any>(null)
  
  // Auto-fill example data
  useEffect(() => {
    if (!responsiveDonationAppId) {
      setResponsiveDonationAppId('1056') // Default ResponsiveDonation app ID
    }
    if (!proposalEventId) {
      setProposalEventId('1756903236') // Example event ID from ResponsiveDonation
    }
  }, [responsiveDonationAppId, proposalEventId])

  const handleProposeOutcome = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!responsiveDonationAppId.trim() || !proposalEventId.trim() || !proposalStake) {
      enqueueSnackbar('Please enter ResponsiveDonation App ID, Event ID, and stake amount', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const stakeAmount = Math.floor(parseFloat(proposalStake) * 1_000_000) // Convert ALGO to microALGO
      
      // Create the payment transaction first
      const paymentTxn = await eventOracleClient.algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: eventOracleClient.appAddress,
        amount: microAlgo(stakeAmount),
      })

      const result = await eventOracleClient.send.proposeOutcome({
        args: {
          responsiveDonationAppId: BigInt(responsiveDonationAppId),
          eventId: BigInt(proposalEventId),
          proposedOutcome: proposalOutcome,
          payment: paymentTxn,
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar(`Outcome proposed! Dispute period started.`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to propose outcome: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRaiseDispute = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!responsiveDonationAppId.trim() || !disputeEventId.trim() || !disputeStake) {
      enqueueSnackbar('Please enter ResponsiveDonation App ID, Event ID, and dispute stake', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const stakeAmount = Math.floor(parseFloat(disputeStake) * 1_000_000)
      
      // Create the payment transaction first
      const paymentTxn = await eventOracleClient.algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: eventOracleClient.appAddress,
        amount: microAlgo(stakeAmount),
      })

      const result = await eventOracleClient.send.raiseDispute({
        args: {
          responsiveDonationAppId: BigInt(responsiveDonationAppId),
          eventId: BigInt(disputeEventId),
          disputeOutcome: disputeOutcome,
          payment: paymentTxn,
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar(`Dispute raised! Voting period started. Dispute ID: ${result.return}`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to raise dispute: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!responsiveDonationAppId.trim() || !voteEventId.trim() || !voteStake) {
      enqueueSnackbar('Please enter ResponsiveDonation App ID, Event ID, and vote stake', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const stakeAmount = Math.floor(parseFloat(voteStake) * 1_000_000)
      
      // Create the payment transaction first
      const paymentTxn = await eventOracleClient.algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: eventOracleClient.appAddress,
        amount: microAlgo(stakeAmount),
      })

      const result = await eventOracleClient.send.vote({
        args: {
          responsiveDonationAppId: BigInt(responsiveDonationAppId),
          eventId: BigInt(voteEventId),
          voteOutcome: voteOutcome,
          payment: paymentTxn,
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar('Vote cast successfully!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to vote: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolveEvent = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!resolveEventId.trim()) {
      enqueueSnackbar('Please enter event ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const result = await eventOracleClient.send.resolveEvent({
        args: {
          eventId: BigInt(resolveEventId),
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar('Event resolved!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to resolve event: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExpediteResolve = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!expediteEventId.trim()) {
      enqueueSnackbar('Please enter event ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const result = await eventOracleClient.send.resolveEventExpedited({
        args: {
          eventId: BigInt(expediteEventId),
          forceOutcome: expediteOutcome,
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar(`Event expedited to ${expediteOutcome ? 'TRUE' : 'FALSE'}!`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to expedite resolution: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!claimEventId.trim()) {
      enqueueSnackbar('Please enter event ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const result = await eventOracleClient.send.claimRewards({
        args: {
          eventId: BigInt(claimEventId),
        },
        extraFee: microAlgo(2000),
      })

      enqueueSnackbar(`Rewards claimed: ${result.return} microALGO!`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to claim rewards: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQueryEvent = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!queryEventId.trim()) {
      enqueueSnackbar('Please enter event ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const result = await eventOracleClient.send.getEventInfo({
        args: {
          eventId: BigInt(queryEventId),
        },
      })

      setEventInfo(result.return)
      enqueueSnackbar('Event info retrieved!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to query event: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolveResponsiveDonation = async () => {
    if (!eventOracleClient || !activeAddress) {
      enqueueSnackbar('Please connect wallet and ensure contract is deployed', { variant: 'warning' })
      return
    }

    if (!integrationEventId.trim() || !responsiveDonationAppId.trim()) {
      enqueueSnackbar('Please enter both Event ID and ResponsiveDonation App ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const result = await eventOracleClient.send.resolveResponsiveDonationEvent({
        args: {
          responsiveDonationAppId: BigInt(responsiveDonationAppId),
          eventId: BigInt(integrationEventId),
        },
        extraFee: microAlgo(3000), // Extra fee for cross-contract call
      })

      enqueueSnackbar('ResponsiveDonation event resolved via EventOracle!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`Failed to resolve ResponsiveDonation event: ${e instanceof Error ? e.message : 'Unknown error'}`, { 
        variant: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Event Oracle Test Page</h1>
          <ConnectWallet />
        </div>
      </div>
    )
  }

  if (clientError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Not Available</h1>
          <p className="text-gray-600 mb-6">{clientError.message}</p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">To use this page:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Build the EventOracle contract: <code className="bg-yellow-100 px-1 rounded">cd projects/event-oracle && algokit project run build</code></li>
              <li>Deploy the contract to localnet: <code className="bg-yellow-100 px-1 rounded">algokit project deploy localnet</code></li>
              <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_EVENT_ORACLE_APP_ID=&lt;app_id&gt;</code> to your .env file</li>
              <li>Restart the frontend dev server</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Oracle Test Interface</h1>
          <p className="text-gray-600">Token-weighted voting oracle with dispute mechanisms</p>
          <p className="text-sm text-gray-500 mt-2">Connected: {activeAddress}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Event */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Create Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  rows={3}
                  placeholder="e.g., Will Bitcoin reach $100,000 by Dec 31, 2024?"
                />
              </div>
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>

          {/* Propose Outcome */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Propose Outcome</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID
                </label>
                <input
                  type="text"
                  value={queryEventId}
                  onChange={(e) => setQueryEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Outcome
                </label>
                <select
                  value={proposalOutcome.toString()}
                  onChange={(e) => setProposalOutcome(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount (ALGO)
                </label>
                <input
                  type="number"
                  value={proposalStake}
                  onChange={(e) => setProposalStake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="10"
                  min="10"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleProposeOutcome}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Proposing...' : 'Propose Outcome'}
              </button>
            </div>
          </div>

          {/* Raise Dispute */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Raise Dispute</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID to Dispute
                </label>
                <input
                  type="text"
                  value={disputeEventId}
                  onChange={(e) => setDisputeEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Dispute Outcome
                </label>
                <select
                  value={disputeOutcome.toString()}
                  onChange={(e) => setDisputeOutcome(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispute Stake (ALGO) - Must be 2x current stake
                </label>
                <input
                  type="number"
                  value={disputeStake}
                  onChange={(e) => setDisputeStake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="20"
                  min="1"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleRaiseDispute}
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Disputing...' : 'Raise Dispute'}
              </button>
            </div>
          </div>

          {/* Vote */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Vote on Disputed Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID
                </label>
                <input
                  type="text"
                  value={voteEventId}
                  onChange={(e) => setVoteEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vote Outcome
                </label>
                <select
                  value={voteOutcome.toString()}
                  onChange={(e) => setVoteOutcome(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vote Stake (ALGO)
                </label>
                <input
                  type="number"
                  value={voteStake}
                  onChange={(e) => setVoteStake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="5"
                  min="1"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleVote}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Voting...' : 'Cast Vote'}
              </button>
            </div>
          </div>

          {/* Resolve Event */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Resolve Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID
                </label>
                <input
                  type="text"
                  value={resolveEventId}
                  onChange={(e) => setResolveEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID to resolve"
                />
              </div>
              <p className="text-sm text-gray-600">
                This will resolve the event based on votes or automatically if no disputes occurred after the deadline.
              </p>
              <button
                onClick={handleResolveEvent}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Resolving...' : 'Resolve Event'}
              </button>
            </div>
          </div>

          {/* Expedited Resolution */}
          <div className="card p-6 border-2 border-yellow-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Expedited Resolution (Demo Only)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID
                </label>
                <input
                  type="text"
                  value={expediteEventId}
                  onChange={(e) => setExpediteEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Force Outcome
                </label>
                <select
                  value={expediteOutcome.toString()}
                  onChange={(e) => setExpediteOutcome(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚡ Demo feature: Instantly resolve events bypassing time constraints. Only works for event creator.
              </p>
              <button
                onClick={handleExpediteResolve}
                disabled={loading}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? 'Expediting...' : 'Expedite Resolution'}
              </button>
            </div>
          </div>

          {/* NEW: Integration with ResponsiveDonation */}
          <div className="card p-6 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 Resolve ResponsiveDonation Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID (resolved in EventOracle)
                </label>
                <input
                  type="text"
                  value={integrationEventId}
                  onChange={(e) => setIntegrationEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter event ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ResponsiveDonation App ID
                </label>
                <input
                  type="text"
                  value={responsiveDonationAppId}
                  onChange={(e) => setResponsiveDonationAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="1056"
                />
              </div>
              <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                🔗 Bridge feature: Use EventOracle's resolution to automatically resolve ResponsiveDonation events and trigger conditional donations.
              </p>
              <button
                onClick={handleResolveResponsiveDonation}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Resolving ResponsiveDonation...' : 'Resolve ResponsiveDonation Event'}
              </button>
            </div>
          </div>

          {/* Claim Rewards */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Claim Rewards</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID
                </label>
                <input
                  type="text"
                  value={claimEventId}
                  onChange={(e) => setClaimEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-900"
                  placeholder="Enter resolved event ID"
                />
              </div>
              <p className="text-sm text-gray-600">
                Claim your rewards from correct votes or proposals after event resolution.
              </p>
              <button
                onClick={handleClaimRewards}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Claiming...' : 'Claim Rewards'}
              </button>
            </div>
          </div>

          {/* Query Event */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Query Event Info</h2>
            <div className="space-y-4">
              <button
                onClick={handleQueryEvent}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Querying...' : 'Get Event Info'}
              </button>
              
              {eventInfo && (
                <div className="bg-gray-50 p-4 rounded text-sm">
                  <h3 className="font-semibold mb-2">Event Information:</h3>
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(eventInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="card p-6 bg-blue-50 border-blue-200 col-span-full">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Basic Flow:</strong></p>
              <p><strong>1.</strong> Create an event with a clear question</p>
              <p><strong>2.</strong> Propose an outcome with 10+ ALGO stake</p>
              <p><strong>3.</strong> Optionally dispute with 2x stake to trigger voting</p>
              <p><strong>4.</strong> Vote with other accounts during voting period</p>
              <p><strong>5.</strong> Resolve event after deadlines pass (or use expedited for demo)</p>
              <p><strong>6.</strong> Claim rewards for correct votes</p>
              
              <p className="pt-2"><strong>Integration Flow:</strong></p>
              <p><strong>7.</strong> Use "Resolve ResponsiveDonation Event" to bridge oracle resolution to conditional donations</p>
              <p><strong>8.</strong> This allows EventOracle to act as an automated resolver for ResponsiveDonation contracts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
