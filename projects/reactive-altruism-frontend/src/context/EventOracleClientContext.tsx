// This context provider gives access to the EventOracle smart contract client.
// This is a separate context from the main ResponsiveDonation contract for testing purposes.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
// These imports allow us to interact with the EventOracle smart contract on the Algorand blockchain
import { EventOracleClient, EventOracleFactory } from '../contracts/EventOracle'
// This utility helps us connect to the Algorand blockchain network
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
// useWallet is a React hook that lets us connect to the user's Algorand wallet
import { useWallet } from '@txnlab/use-wallet-react'
// These helpers get the necessary configuration to connect to Algorand nodes from our environment
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/getAlgorandConfigs'

// Get the EventOracle smart contract app ID from the environment
// You'll need to add VITE_EVENT_ORACLE_APP_ID to your .env file
const getEventOracleAppId = () => {
  const appId = import.meta.env.VITE_EVENT_ORACLE_APP_ID
  if (!appId) {
    throw new Error('VITE_EVENT_ORACLE_APP_ID is not set in environment variables')
  }
  return Number(appId)
}

type EventOracleClientContextType = {
  eventOracleClient: EventOracleClient | null
  error: Error | null
  isContractBuilt: boolean
}

const EventOracleClientContext = createContext<EventOracleClientContextType>({
  eventOracleClient: null,
  error: null,
  isContractBuilt: true, // Since we're using direct imports, the contract is built if we get here
})

export const EventOracleClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactionSigner, activeAddress } = useWallet()
  const stableSigner = useMemo(() => transactionSigner, [activeAddress])

  const [eventOracleClient, setEventOracleClient] = useState<EventOracleClient | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // This effect sets up the connection to the EventOracle smart contract client
    if (!activeAddress || !stableSigner) {
      setEventOracleClient(null)
      return
    }

    setError(null)

    try {
      const algodConfig = getAlgodConfigFromViteEnvironment()
      const indexerConfig = getIndexerConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

      // Get the app ID for the EventOracle contract
      let appId: number
      try {
        appId = getEventOracleAppId()
      } catch (appIdError) {
        setError(appIdError as Error)
        return
      }

      const factory = new EventOracleFactory({
        defaultSender: activeAddress,
        algorand,
      })

      const client = factory.getAppClientById({
        appId,
        defaultSender: activeAddress,
        defaultSigner: stableSigner,
      })

      client.algorand.setDefaultSigner(stableSigner)
      setEventOracleClient(client)
    } catch (e) {
      setError(e as Error)
      setEventOracleClient(null)
    }
  }, [activeAddress, stableSigner])

  return (
    <EventOracleClientContext.Provider value={{ eventOracleClient, error, isContractBuilt: true }}>
      {children}
    </EventOracleClientContext.Provider>
  )
}

export const useEventOracleClient = () => useContext(EventOracleClientContext)
