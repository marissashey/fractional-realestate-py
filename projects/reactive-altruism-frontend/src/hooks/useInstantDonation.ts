import { microAlgo } from '@algorandfoundation/algokit-utils'
import { useState } from 'react'
import { ResponsiveDonationClient } from '../contracts/ResponsiveDonation'

/**
 * Custom hook to make instant donations using the ResponsiveDonation contract.
 * @param appClient The ResponsiveDonationClient instance
 * @param activeAddress The address of the user making the donation
 */
export function useInstantDonation(appClient: ResponsiveDonationClient | null, activeAddress: string | null | undefined) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Make an instant donation to a recipient
   * @param recipientAddress The address to receive the donation
   * @param donationAmount The amount to donate in ALGO
   */
  const makeInstantDonation = async (recipientAddress: string, donationAmount: string) => {
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

      // Create the grouped transaction with payment and app call
      const result = await appClient.send.instantaneousPayout({
        args: {
          recipientAddress,
          payment: paymentTxn,
        },
        // Add extra fee for the inner transaction
        extraFee: microAlgo(1000),
      })

      setSuccess(`Donation successful! Transaction ID: ${result.transaction.txID()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to make donation')
    } finally {
      setLoading(false)
    }
  }

  return { makeInstantDonation, loading, error, success, setSuccess, setError }
}
