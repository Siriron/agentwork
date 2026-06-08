import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'

// Replace with your Coinbase Developer Platform API key
// Get one free at: https://portal.cdp.coinbase.com/
export const CDP_API_KEY = import.meta.env.VITE_CDP_API_KEY || 'your-cdp-api-key'

// WalletConnect project ID — get free at https://cloud.walletconnect.com/
export const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'your-wc-project-id'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'AgentWork',
      appLogoUrl: 'https://agentwork.vercel.app/logo.png',
    }),
    metaMask(),
    walletConnect({
      projectId: WC_PROJECT_ID,
    }),
  ],
  transports: {
    [base.id]: http(),
  },
})
