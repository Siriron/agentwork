import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ThemeProvider } from './ThemeContext'
import { NetworkProvider } from './NetworkContext'
import App from './App'
import './index.css'

// Builder code: bc_ee95izc3 (ERC-8021 encoded)
const DATA_SUFFIX = '0x62635f65653935697a63330b0080218021802180218021802180218021'

const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName:  'AgentWork',
      appLogoUrl: 'https://agentwork.xyz/favicon.svg',
    }),
    walletConnect({
      projectId: import.meta.env.VITE_WC_PROJECT_ID || 'placeholder',
    }),
  ],
  transports: {
    [base.id]:        http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  dataSuffix: DATA_SUFFIX,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_CDP_API_KEY || ''}
          chain={base}
          config={{
            appearance: {
              name:   'AgentWork',
              theme:  'default',
              mode:   'auto',
            },
            paymaster: import.meta.env.VITE_PAYMASTER_URL || undefined,
          }}
        >
          <ThemeProvider>
            <NetworkProvider>
              <App />
            </NetworkProvider>
          </ThemeProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
