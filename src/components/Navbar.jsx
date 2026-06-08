import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity'

const NAV_LINKS = [
  { label: 'Tasks', path: '/tasks' },
  { label: 'Post Task', path: '/post' },
  { label: 'Dashboard', path: '/dashboard' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid #1E2128',
      background: 'rgba(10,11,13,0.92)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            background: '#0052FF',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <span style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>
            Agent<span style={{ color: '#0052FF' }}>Work</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                color: location.pathname === link.path ? '#F9FAFB' : '#9CA3AF',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 14,
                padding: '6px 14px',
                borderRadius: 8,
                background: location.pathname === link.path ? '#1E2128' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Base Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          border: '1px solid #1E2128',
          background: 'rgba(0,82,255,0.08)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0052FF' }} />
          <span style={{ color: '#60A5FA', fontSize: 12, fontWeight: 600 }}>Base</span>
        </div>

        {/* OnchainKit Wallet */}
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    </nav>
  )
}
