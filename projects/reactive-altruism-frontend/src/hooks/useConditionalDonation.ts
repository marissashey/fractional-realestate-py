import { microAlgo } from '@algorandfoundation/algokit-utils'
import { useState } from 'react'
import { ResponsiveDonationClient } from '../contracts/ResponsiveDonation'

/**
 * Custom hook to create conditional donations using the ResponsiveDonation contract.
 * @param appClient The ResponsiveDonationClient instance
 * @param activeAddress The address of the user creating the conditional donation
 */
export function useConditionalDonation(appClient: ResponsiveDonationClient | null, activeAddress: string | null | undefined) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Create a conditional donation
   * @param eventId The ID of the event this donation depends on
   * @param recipientYes Address to receive funds if event resolves to true
   * @param recipientNo Address to receive funds if event resolves to false
   * @param donationAmount The amount to donate in ALGO
   */
  const createConditionalDonation = async (
    eventId: string,
    recipientYes: string,
    recipientNo: string,
    donationAmount: string
  ) => {
    if (!appClient || !activeAddress) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert ALGO to microAlgos (1 ALGO = 1,000,000 microAlgos)
      const amountInMicroAlgosNumber = Math.floor(parseFloat(donationAmount) * 1_000_000)

      // Create the payment transaction first
      const paymentTxn = await appClient.algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: microAlgo(amountInMicroAlgosNumber),
      })

      const result = await appClient.send.createConditionalDonation({
        args: {
          eventId: BigInt(eventId),
          recipientYes,
          recipientNo,
          payment: paymentTxn,
        },
        // Add extra fee for box storage and operations
        extraFee: microAlgo(2000),
      })

      setSuccess(`Conditional donation created! Clause ID: ${result.return}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create conditional donation')
    } finally {
      setLoading(false)
    }
  }

  return { createConditionalDonation, loading, error, success, setSuccess, setError }
}
