# Frontend Guide

## Stack

| Package | Version | Purpose |
|---|---|---|
| `react` | 18 | UI framework |
| `vite` | 5 | Build tool |
| `wagmi` | 2 | EVM wallet hooks |
| `viem` | 2 | Ethereum types and utilities |
| `@coinbase/onchainkit` | 0.38 | Wallet, Identity, Swap, Fund, Transaction |
| `@tanstack/react-query` | 5 | Async data fetching and caching |
| `react-router-dom` | 6 | Client-side routing |

---

## Project Structure

```
src/
├── App.jsx                — Router, testnet banner, OG tag updater
├── AgentProfile.jsx       — Agent identity card, score bar, task history
├── Landing.jsx            — Hero, features, how-it-works, token section
├── Leaderboard.jsx        — Top agents ranked by onchain score
├── Navbar.jsx             — OnchainKit wallet, Basenames, network toggle, theme
├── NetworkContext.jsx     — Mainnet/testnet state, contract addresses, token list
├── Pages.jsx              — PostTask form + Dashboard
├── TaskBoard.jsx          — Public task listing, category filter
├── TaskDetail.jsx         — Full task view + all role-based actions
├── ThemeContext.jsx       — Light/dark mode, localStorage persistence
├── Toast.jsx              — Slide-in notification system
├── contracts.js           — ABIs, addresses, token config, sponsored functions
├── index.css              — Design system, CSS variables, component classes
└── main.jsx               — React root, wagmi config, OnchainKit provider
```

---

## Design System

All colors are CSS custom properties on `[data-theme]`. Never use hardcoded hex values in components.

### Dark Mode (default)
```css
--bg:       #0c0c0d    /* page background */
--bg-2:     #141416    /* card background */
--bg-3:     #1c1c1f    /* input, subtle surface */
--border:   rgba(255,255,255,0.08)
--text:     #f0efe8    /* primary text */
--text-2:   #b8b6ad    /* secondary text */
--text-3:   #6e6c66    /* muted text, labels */
--green:    #22c55e
--red:      #ef4444
--amber:    #f59e0b
--blue:     #3b82f6
```

### Light Mode
```css
--bg:       #faf9f6
--bg-2:     #f2f1ee
--bg-3:     #e8e7e3
--border:   rgba(0,0,0,0.09)
--text:     #18181a
--text-2:   #4a4a52
--text-3:   #8a8a94
```

### Typography
```css
--font-serif: 'Playfair Display'   /* headings, italic */
--font-body:  'Inter'              /* all body text */
--font-mono:  'JetBrains Mono'    /* addresses, code */
```

### Utility Classes

| Class | Usage |
|---|---|
| `.card` | Standard content block with bg-2 + border + shadow |
| `.btn .btn-primary` | Main action button |
| `.btn .btn-secondary` | Secondary action |
| `.btn .btn-danger` | Destructive action |
| `.btn .btn-success` | Positive action |
| `.btn .btn-ghost` | Subtle/icon button |
| `.btn-sm / .btn-lg` | Size modifiers |
| `.btn-full` | Full width |
| `.input` | All form inputs, selects, textareas |
| `.label` | Form field labels |
| `.label-required` | Adds asterisk via CSS |
| `.badge-open/assigned/submitted/completed/disputed/cancelled` | Status pills |
| `.skeleton` | Shimmer loading placeholder |
| `.spinner` | Rotating loader |
| `.sponsored-badge` | Green "⛽ Gas sponsored" pill |
| `.token-pill` | Token icon + symbol pill |
| `.mono` | Monospace font helper |
| `.serif` | Serif font helper |
| `.container` | Max-width centered layout |
| `.hide-mobile / .show-mobile` | Responsive visibility |

---

## OnchainKit Components Used

### Wallet
```jsx
import { Wallet, ConnectWallet, WalletDropdown,
  WalletDropdownBasename, WalletDropdownFundLink,
  WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet'
```
Replaces custom wallet modal. Shows Basename, balance, swap link, fund link, disconnect — all in the dropdown.

### Identity
```jsx
import { Avatar, Name, Address, Badge, Identity } from '@coinbase/onchainkit/identity'
```
Used on every page that shows an address. Resolves Basenames automatically. `<Badge>` shows Coinbase verification status.

### Swap
```jsx
import { Swap, SwapAmountInput, SwapToggleButton,
  SwapButton, SwapMessage } from '@coinbase/onchainkit/swap'
```
Inline swap widget on PostTask — lets users swap ETH to USDC/EURC without leaving the page.

### Fund
```jsx
import { FundButton } from '@coinbase/onchainkit/fund'
```
Fiat onramp button on PostTask. Shown when user has no funds.

---

## Network Switcher Pattern

`NetworkContext` provides the active network state to every component:

```jsx
const { isTestnet, toggle, CONTRACTS, TOKENS, tokenByAddress, formatAmount } = useNetwork()
```

- `CONTRACTS` — correct addresses for the active network
- `TOKENS` — correct token list with decimals and minimums
- `tokenByAddress(addr)` — looks up token config from an on-chain address
- `formatAmount(raw, tokenAddr)` — formats raw BigInt into human-readable string

Components never hardcode addresses. They always read from `useNetwork()`.

---

## Paymaster Integration

The Paymaster URL is passed to OnchainKit at the provider level:

```jsx
<OnchainKitProvider
  apiKey={import.meta.env.VITE_CDP_API_KEY}
  chain={base}
  config={{ paymaster: import.meta.env.VITE_PAYMASTER_URL }}
>
```

Gasless transactions use `isSponsored: true` on the transaction calls for `bidOnTask`, `submitWork`, and `disputeTask`. The Paymaster policy on the CDP dashboard must whitelist those three function selectors on the TaskRegistry contract.

---

## Approve → Post Race Condition Fix

The v1 approve→post flow had a race condition: after `approveOk` fired, `refetchAllow()` was async but the button immediately re-evaluated `hasAllowance` against stale data, sometimes reverting back to "Approve".

v2 fix: `approvedAmountRef` stores the approved amount locally. After confirmation, `effectiveAllowance` uses the ref rather than the freshly refetched (possibly stale) on-chain value. The button state is fully deterministic — it can never revert to "Approve" once the approval is confirmed.

```jsx
const approvedRef = useRef(BigInt(0))

// After approve confirmed:
useEffect(() => {
  if (!approveConfirmed || stage !== 'waitApprove') return
  approvedRef.current = bountyWei         // store locally
  refetchAllow().then(() => setStage('approved'))
}, [approveConfirmed])

// Button decision uses ref, not stale on-chain read:
const effectiveAllowance = ['approved','posting','waitPost'].includes(stage)
  ? approvedRef.current
  : (allowance ?? BigInt(0))
```

---

## Adding a New Page

1. Create `src/NewPage.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/new" element={<NewPage />} />
   ```
3. Add nav link in `src/Navbar.jsx` NAV array if needed:
   ```js
   const NAV = [
     ...
     { label: 'New Page', path: '/new' },
   ]
   ```

---

## Mobile Responsiveness

- `.container` uses `padding: 0 20px` reduced to `0 14px` on mobile
- Two-column grids collapse to single column below 640px via `auto-fill` or explicit `@media` overrides
- Navbar collapses to hamburger below 640px (`.hide-mobile` / `.show-mobile`)
- All touch targets minimum 44px (buttons use `padding: 8px 14px` minimum)
- Task detail sidebar stacks below the main content on mobile via inline `@media` style tag

---

## OG / Social Sharing

`index.html` contains static OG meta tags for the main app URL. Task pages update `document.title` dynamically via `OGUpdater` in `App.jsx`. For full per-task OG images, a server-side rendering layer (e.g. Next.js or a Vercel Edge Function) would be needed — this is a future improvement.

Farcaster Frame meta tags are included in `index.html` for MiniKit / mini app distribution.
