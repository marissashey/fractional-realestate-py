import { microAlgo } from '@algorandfoundation/algokit-utils'
import { useState, useCallback } from 'react'
import { ResponsiveDonationClient, ConditionalClauseStruct } from '../contracts/ResponsiveDonation'

/**
 * Custom hook to manage conditional clauses in the ResponsiveDonation contract.
 * @param appClient The ResponsiveDonationClient instance
 * @param activeAddress The address of the user
 */
export function useClauses(appClient: ResponsiveDonationClient | null, activeAddress: string | null | undefined) {
  const [clauses, setClauses] = useState<[bigint, ConditionalClauseStruct][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Execute a conditional clause after its associated event has been resolved
   * @param clauseId The clause ID to execute
   */
  const executeConditionalClause = async (clauseId: string) => {
    if (!appClient || !activeAddress) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await appClient.send.executeConditionalClause({
        args: {
          clauseId: BigInt(clauseId),
        },
        // Add extra fee for the inner payment transaction
        extraFee: microAlgo(1000),
      })

      setSuccess(`Conditional clause executed successfully!`)
      // Refresh clauses list
      await fetchClauses()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute conditional clause')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch all conditional clauses from the contract
   */
  const fetchClauses = useCallback(async () => {
    if (!appClient) return

    setLoading(true)
    setError(null)

    try {
      const conditionalClauses = await appClient.state.box.conditionalClauses.getMap()
      setClauses(Array.from(conditionalClauses.entries()) as [bigint, ConditionalClauseStruct][])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch clauses')
    } finally {
      setLoading(false)
    }
  }, [appClient])

  /**
   * Get information about a specific clause
   * @param clauseId The clause ID to query
   */
  const getClauseInfo = async (clauseId: string): Promise<ConditionalClauseStruct | null> => {
    if (!appClient) return null

    try {
      const clauseInfo = await appClient.getClauseInfo({
        args: { clauseId: BigInt(clauseId) }
      })
      return clauseInfo
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get clause info')
      return null
    }
  }

  /**
   * Get clauses for a specific user (donor)
   * @param donorAddress The address of the donor
   */
  const getClausesForDonor = useCallback((donorAddress: string) => {
    return clauses.filter(([_, clause]) => 
      clause.donorAddress.toLowerCase() === donorAddress.toLowerCase()
    )
  }, [clauses])

  /**
   * Get executable clauses (where event is resolved but clause not executed)
   */
  const getExecutableClauses = useCallback(() => {
    return clauses.filter(([_, clause]) => !clause.executed)
  }, [clauses])

  return {
    clauses,
    executeConditionalClause,
    fetchClauses,
    getClauseInfo,
    getClausesForDonor,
    getExecutableClauses,
    loading,
    error,
    success,
    setSuccess,
    setError
  }
}
