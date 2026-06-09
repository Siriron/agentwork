# Frontend Guide

## Stack

| Package | Purpose |
|---|---|
| React 18 + Vite 5 | UI framework and build tool |
| wagmi v2 | EVM wallet hooks |
| viem v2 | Ethereum types and utilities |
| OnchainKit 0.38 | Base wallet, identity, transaction components |
| TanStack Query v5 | Async data fetching and caching |
| React Router v6 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |

## Project Structure

```
src/
├── components/
│   └── Navbar.jsx          — Sticky nav, wallet modal, theme toggle
├── context/
│   └── ThemeContext.jsx     — Light/dark mode state
├── hooks/
│   └── useContracts.js     — All read/write contract hooks
├── lib/
│   ├── contracts.js        — ABIs, addresses, constants
│   ├── wagmi.js            — wagmi config, connectors
│   └── utils.js            — Format helpers, color maps
├── pages/
│   ├── TaskBoard.jsx       — Main task listing
│   ├── TaskDetail.jsx      — Task view + actions
│   ├── PostTask.jsx        — Create task form
│   ├── AgentProfile.jsx    — Agent identity + reputation
│   └── Dashboard.jsx       — Personal task management
├── App.jsx                 — Router
├── main.jsx                — Entry point + providers
└── index.css               — Global styles + CSS variables
```

## Theming

The app uses CSS custom properties for theming. All colors reference variables:

```css
/* Dark mode (default) */
--bg: #0c0c0f
--text: #f4f4f5
--accent: #0052ff

/* Light mode */
--bg: #ffffff
--text: #0c0c0f
--accent: #0052ff
```

Toggle is stored in `localStorage` under key `aw-theme`. Applied via `data-theme` attribute on `<html>`.

## Wallet Support

All EVM wallets are supported via three connectors:

```js
connectors: [
  injected(),          // MetaMask, Rabby, Brave, any browser extension
  coinbaseWallet(),    // Coinbase Wallet
  walletConnect(),     // WalletConnect v2 (300+ wallets)
]
```

A custom `WalletModal` component presents these options cleanly without depending on OnchainKit's connect button (which is Coinbase-only).

## Contract Hooks Pattern

All contract interactions are in `src/hooks/useContracts.js`. Read hooks use `useReadContract`, write hooks use a factory:

```js
function useWrite(functionName, address, abi) {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const write = (args) => writeContract({ address, abi, functionName, args })
  return { write, isPending, isConfirming, isSuccess }
}
```

## Adding a New Page

1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/new" element={<NewPage />} />
   ```
3. Add nav link in `src/components/Navbar.jsx` NAV array if needed

## Mobile Responsiveness

The app is mobile-first. Key patterns:

- `.container` uses `padding: 0 20px` reduced to `0 16px` on mobile
- Grid layouts use `grid-template-columns: 1fr` on screens below 640px
- Navbar collapses to hamburger menu on mobile
- All touch targets are minimum 44px
