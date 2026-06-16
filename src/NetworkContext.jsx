import { createContext, useContext, useState } from 'react'
import {
  MAINNET_CONTRACTS, TESTNET_CONTRACTS,
  MAINNET_TOKENS,    TESTNET_TOKENS,
} from './contracts'

const Ctx = createContext(null)
const KEY = 'aw_network'

export function NetworkProvider({ children }) {
  const [isTestnet, setIsTestnet] = useState(() => localStorage.getItem(KEY) === 'testnet')

  const toggle = () => setIsTestnet(v => {
    const next = !v
    localStorage.setItem(KEY, next ? 'testnet' : 'mainnet')
    return next
  })

  const CONTRACTS = isTestnet ? TESTNET_CONTRACTS : MAINNET_CONTRACTS
  const TOKENS    = isTestnet ? TESTNET_TOKENS    : MAINNET_TOKENS

  const tokenByAddress = addr => TOKENS.find(t => t.address.toLowerCase() === addr?.toLowerCase()) || null
  const formatAmount   = (raw, tokenAddr) => {
    const t = tokenByAddress(tokenAddr)
    if (!t) return raw?.toString() || '0'
    return (Number(raw) / 10 ** t.decimals).toFixed(t.decimals === 18 ? 6 : 2)
  }

  return (
    <Ctx.Provider value={{ isTestnet, toggle, CONTRACTS, TOKENS, tokenByAddress, formatAmount }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNetwork() { return useContext(Ctx) }
