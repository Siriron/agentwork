import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import { http, createConfig } from 'wagmi'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'
import { ThemeProvider } from './ThemeContext'
import App from './App'
import './index.css'

// Builder code: bc_ee95izc3 (ERC-8021 encoded)
const DATA_SUFFIX = '0x62635f65653935697a63330b0080218021802180218021802180218021'

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'AgentWork' }),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID || 'placeholder' }),
  ],
  transports: { [base.id]: http('https://mainnet.base.org') },
  dataSuffix: DATA_SUFFIX,
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider apiKey={import.meta.env.VITE_CDP_API_KEY || ''} chain={base}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
