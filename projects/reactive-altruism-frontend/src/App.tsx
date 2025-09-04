import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { useState, useEffect } from 'react'
import Home from './Home'
import EventOracleTestPage from './pages/EventOracleTestPage'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/getAlgorandConfigs'
import { AppClientProvider } from './context/AppClientContext'
import { EventOracleClientProvider } from './context/EventOracleClientContext'

let supportedWallets: SupportedWallet[]

if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    { id: WalletId.LUTE },
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname)

  // Simple URL routing - listen for URL changes and check on mount
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname)
    }
    
    // Check current path on mount
    setCurrentRoute(window.location.pathname)
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  // Route to Event Oracle test page if URL is /oracle
  if (currentRoute === '/oracle') {
    return (
      <SnackbarProvider maxSnack={3}>
        <WalletProvider manager={walletManager}>
          <EventOracleClientProvider>
            <EventOracleTestPage />
          </EventOracleClientProvider>
        </WalletProvider>
      </SnackbarProvider>
    )
  }

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <AppClientProvider>
          <Home />
        </AppClientProvider>
      </WalletProvider>
    </SnackbarProvider>
  )
}
