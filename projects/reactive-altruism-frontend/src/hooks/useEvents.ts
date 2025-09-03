import { microAlgo } from '@algorandfoundation/algokit-utils'
import { useState, useCallback } from 'react'
import { ResponsiveDonationClient, EventStruct } from '../contracts/ResponsiveDonation'

/**
 * Custom hook to manage events in the ResponsiveDonation contract.
 * @param appClient The ResponsiveDonationClient instance
 * @param activeAddress The address of the user
 */
export function useEvents(appClient: ResponsiveDonationClient | null, activeAddress: string | null | undefined) {
  const [events, setEvents] = useState<[bigint, EventStruct][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Create a new event
   * @param eventString Description of the event
   * @param oracleAddress Address authorized to resolve this event
   */
  const createEvent = async (eventString: string, oracleAddress: string) => {
    if (!appClient || !activeAddress) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await appClient.send.createEvent({
        args: {
          eventString,
          oracleAddress,
        },
        // Add extra fee for box storage
        extraFee: microAlgo(2000),
      })

      setSuccess(`Event created! Event ID: ${result.return}`)
      // Refresh events list
      await fetchEvents()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resolve an event (only callable by the oracle)
   * @param eventId The event ID to resolve
   * @param resolution The outcome of the event (true/false)
   */
  const resolveEvent = async (eventId: string, resolution: boolean) => {
    if (!appClient || !activeAddress) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await appClient.send.resolveEvent({
        args: {
          eventId: BigInt(eventId),
          resolution,
        },
        extraFee: microAlgo(1000),
      })

      setSuccess(`Event resolved! Result: ${resolution ? 'True' : 'False'}`)
      // Refresh events list
      await fetchEvents()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve event')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch all events from the contract
   */
  const fetchEvents = useCallback(async () => {
    if (!appClient) return

    setLoading(true)
    setError(null)

    try {
      const listedEvents = await appClient.state.box.listedEvents.getMap()
      setEvents(Array.from(listedEvents.entries()) as [bigint, EventStruct][])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [appClient])

  /**
   * Get information about a specific event
   * @param eventId The event ID to query
   */
  const getEventInfo = async (eventId: string): Promise<EventStruct | null> => {
    if (!appClient) return null

    try {
      const eventInfo = await appClient.getEventInfo({
        args: { eventId: BigInt(eventId) }
      })
      return eventInfo
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get event info')
      return null
    }
  }

  return {
    events,
    createEvent,
    resolveEvent,
    fetchEvents,
    getEventInfo,
    loading,
    error,
    success,
    setSuccess,
    setError
  }
}
