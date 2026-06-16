import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ConnectWallet, Wallet, WalletDropdown,
  WalletDropdownBasename, WalletDropdownFundLink, WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'
import { Avatar, Name } from '@coinbase/onchainkit/identity'
import { base, baseSepolia } from 'wagmi/chains'
import { useSwitchChain, useAccount } from 'wagmi'
import { useTheme } from './ThemeContext'
import { useNetwork } from './NetworkContext'

function SunIcon()  { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="2.8"/><path d="M7.5 1v1M7.5 13v1M1 7.5h1M13 7.5h1M3.2 3.2l.7.7M11.1 11.1l.7.7M11.1 3.2l-.7.7M3.2 11.1l-.7.7"/></svg> }
function MoonIcon() { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12.5 9A5.5 5.5 0 016 2.5a5.5 5.5 0 000 10 5.5 5.5 0 006.5-3.5z"/></svg> }

function NetworkToggle() {
  const { isTestnet, toggle } = useNetwork()
  const { switchChain } = useSwitchChain()

  const handle = () => {
    toggle()
    try { switchChain({ chainId: isTestnet ? base.id : baseSepolia.id }) } catch (_) {}
  }

  return (
    <button onClick={handle} title={isTestnet ? 'Switch to Mainnet' : 'Switch to Testnet'}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'4px 10px', borderRadius:20,
        border:`1px solid ${isTestnet ? 'var(--amber)' : 'var(--green)'}`,
        background: isTestnet ? 'var(--amber-dim)' : 'var(--green-dim)',
        color: isTestnet ? 'var(--amber)' : 'var(--green)',
        fontSize:11, fontWeight:700, cursor:'pointer',
        letterSpacing:'0.04em', whiteSpace:'nowrap',
        transition:'var(--transition)',
      }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: isTestnet ? 'var(--amber)' : 'var(--green)', flexShrink:0 }}/>
      {isTestnet ? 'Testnet' : 'Mainnet'}
    </button>
  )
}

const NAV = [
  { label:'Tasks',       path:'/tasks' },
  { label:'Post Task',   path:'/post' },
  { label:'Leaderboard', path:'/leaderboard' },
  { label:'Dashboard',   path:'/dashboard' },
  { label:'Docs',        path:'/docs' },
]

export default function Navbar() {
  const { pathname }             = useLocation()
  const { theme, toggle }        = useTheme()
  const { address }              = useAccount()
  const [mobile, setMobile]      = useState(false)

  return (
    <nav style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)', position:'sticky', top:0, zIndex:50 }}>
      <div className="container" style={{ height:54, display:'flex', alignItems:'center', gap:8 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8, marginRight:14, flexShrink:0 }}
          onClick={() => setMobile(false)}>
          <div style={{ width:26, height:26, borderRadius:7, background:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5v5L7 13 1 9.5v-5L7 1z" stroke="var(--bg)" strokeWidth="1.4" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="var(--bg)"/>
            </svg>
          </div>
          <span className="serif" style={{ fontWeight:700, fontSize:16, color:'var(--text)', fontStyle:'italic' }}>AgentWork</span>
        </Link>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display:'flex', gap:2, flex:1 }}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path} style={{
              textDecoration:'none', fontSize:13, padding:'5px 10px', borderRadius:6,
              color: pathname === n.path || pathname.startsWith(n.path + '/') ? 'var(--text)' : 'var(--text-3)',
              background: pathname === n.path || pathname.startsWith(n.path + '/') ? 'var(--bg-3)' : 'transparent',
              fontWeight: pathname === n.path ? 500 : 400,
              transition:'var(--transition)',
            }}>
              {n.label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <NetworkToggle/>

          <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ padding:'6px 7px', color:'var(--text-3)' }}>
            {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
          </button>

          {/* OnchainKit wallet — Basename, balances, fund, disconnect */}
          <Wallet>
            <ConnectWallet className="btn btn-primary btn-sm">
              <Avatar className="hide-mobile" style={{ width:18, height:18 }}/>
              <Name/>
            </ConnectWallet>
            <WalletDropdown>
              <WalletDropdownBasename/>
              <WalletDropdownFundLink/>
              <WalletDropdownDisconnect/>
            </WalletDropdown>
          </Wallet>

          {/* Hamburger — mobile only */}
          <button onClick={() => setMobile(o => !o)}
            className="btn btn-ghost btn-sm show-mobile" style={{ padding:'6px 7px' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {mobile
                ? <><path d="M2 2l13 13"/><path d="M15 2L2 15"/></>
                : <><path d="M2 4h13"/><path d="M2 8.5h13"/><path d="M2 13h13"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobile && (
        <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg-2)', padding:'6px 16px 16px' }}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path} onClick={() => setMobile(false)} style={{
              display:'block', padding:'12px 4px', fontSize:14,
              color: pathname === n.path ? 'var(--text)' : 'var(--text-2)',
              textDecoration:'none', borderBottom:'1px solid var(--border)',
              fontWeight: pathname === n.path ? 500 : 400,
            }}>
              {n.label}
            </Link>
          ))}
          {address && (
            <Link to={`/agent/${address}`} onClick={() => setMobile(false)} style={{
              display:'block', padding:'12px 4px', fontSize:14,
              color:'var(--text-2)', textDecoration:'none',
            }}>
              My Profile
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
