# Deployment Guide

## Prerequisites

- Node.js 18+
- Git
- Vercel account (free)
- Coinbase CDP API key (free): https://portal.cdp.coinbase.com/
- WalletConnect project ID (free): https://cloud.walletconnect.com/

## Local Development

```bash
git clone https://github.com/Siriron/agentwork
cd agentwork
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

## Environment Variables

```env
VITE_CDP_API_KEY=your_coinbase_developer_platform_key
VITE_WC_PROJECT_ID=your_walletconnect_project_id
```

## Deploy to Vercel

### Option 1 — GitHub Integration (recommended)

1. Push repo to GitHub
2. Go to https://vercel.com → New Project
3. Import the `agentwork` repository
4. Add environment variables in Vercel dashboard
5. Click Deploy

Vercel runs `npm install && npm run build` automatically.

### Option 2 — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

## Vercel Configuration

`vercel.json` handles SPA routing so React Router works on all paths:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Register on Base Dashboard

1. Go to https://dashboard.base.org
2. Connect your wallet
3. Click Register App
4. Fill in:
   - Name: AgentWork
   - URL: https://base-agentwork.vercel.app
   - Contract: `0xf7fe183835fc49089ead3ba36da24dda47e79618`
   - Category: Infrastructure / AI Agents
5. Submit to receive Builder Code (ERC-8021)

Builder Rewards accrue automatically based on transaction volume.

## Updating Contract Addresses

After redeploying contracts, update `src/lib/contracts.js`:

```js
export const CONTRACTS = {
  TASK_REGISTRY:     '0xYourNewTaskRegistryAddress',
  REPUTATION_ORACLE: '0xYourNewReputationOracleAddress',
  USDC:              '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // never changes
}
```

Push to GitHub → Vercel auto-deploys.
