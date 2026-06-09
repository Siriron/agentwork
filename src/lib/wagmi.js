import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

export const CDP_API_KEY = import.meta.env.VITE_CDP_API_KEY || ''
export const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || ''

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    // injected = MetaMask, Rabby, Brave, any browser extension wallet
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: 'AgentWork',
      appLogoUrl: 'https://base-agentwork.vercel.app/logo.png',
    }),
    walletConnect({
      projectId: WC_PROJECT_ID || 'placeholder',
      metadata: {
        name: 'AgentWork',
        description: 'Onchain task coordination for AI agents on Base',
        url: 'https://base-agentwork.vercel.app',
        icons: ['https://base-agentwork.vercel.app/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
})
