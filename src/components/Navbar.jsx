import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M11.8 3.5l-.7.7M3.5 11.8l-.7.7"/></svg>
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 000 11 6 6 0 007-4z"/></svg>
}

function WalletModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()
  const labels = { injected: 'Browser Wallet (MetaMask, Rabby…)', coinbaseWallet: 'Coinbase Wallet', walletConnect: 'WalletConnect' }
  const icons = { injected: '🦊', coinbaseWallet: '🔵', walletConnect: '🔗' }
  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div className="card" style={{ width:'100%',maxWidth:360,padding:24 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:17,fontWeight:600,color:'var(--text)' }}>Connect Wallet</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding:'4px 10px' }}>✕</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {connectors.map(connector => (
            <button key={connector.uid} className="btn btn-secondary" style={{ justifyContent:'flex-start',gap:12,padding:'12px 16px' }}
              onClick={() => { connect({ connector }); onClose() }} disabled={isPending}>
              <span style={{ fontSize:20 }}>{icons[connector.id] || '💼'}</span>
              <span style={{ textAlign:'left' }}>{labels[connector.id] || connector.name}</span>
            </button>
          ))}
        </div>
        <p style={{ color:'var(--text-3)',fontSize:12,textAlign:'center',marginTop:16,lineHeight:1.5 }}>Any EVM wallet · Base mainnet</p>
      </div>
    </div>
  )
}

const NAV = [{ label:'Tasks', path:'/' }, { label:'Post Task', path:'/post' }, { label:'Dashboard', path:'/dashboard' }]

export default function Navbar() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showWallet, setShowWallet] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'var(--bg)',borderBottom:'1px solid var(--border)' }}>
        <div className="container" style={{ height:56,display:'flex',alignItems:'center',gap:8 }}>
          <Link to="/" style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:8,marginRight:8,flexShrink:0 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13 5v5l-5.5 3.5L2 10V5L7.5 1.5z" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="7.5" cy="7.5" r="2" fill="white"/></svg>
            </div>
            <span style={{ fontWeight:700,fontSize:15,color:'var(--text)',letterSpacing:'-0.2px' }}>AgentWork</span>
          </Link>

          <div style={{ display:'flex',gap:2,flex:1 }} className="hide-mobile">
            {NAV.map(n => (
              <Link key={n.path} to={n.path} style={{ textDecoration:'none',fontSize:14,fontWeight:500,padding:'5px 12px',borderRadius:7, color:location.pathname===n.path?'var(--text)':'var(--text-2)', background:location.pathname===n.path?'var(--bg-3)':'transparent',transition:'all 0.15s' }}>
                {n.label}
              </Link>
            ))}
          </div>

          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:6 }}>
            <div className="hide-mobile" style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:99,border:'1px solid var(--border)',background:'var(--accent-dim2)' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent)' }} />
              <span style={{ fontSize:12,fontWeight:600,color:'var(--accent)' }}>Base</span>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={toggle} style={{ padding:'7px 8px',color:'var(--text-2)' }} title="Toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {isConnected ? (
              <div style={{ position:'relative' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDropdown(d=>!d)} style={{ gap:6,fontFamily:'JetBrains Mono,monospace',fontSize:12 }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:'var(--green)',flexShrink:0 }} />
                  {address?.slice(0,6)}…{address?.slice(-4)}
                </button>
                {showDropdown && (
                  <>
                    <div style={{ position:'fixed',inset:0,zIndex:55 }} onClick={() => setShowDropdown(false)} />
                    <div style={{ position:'absolute',top:'calc(100% + 6px)',right:0,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:10,padding:6,minWidth:180,boxShadow:'var(--shadow-lg)',zIndex:60 }}>
                      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex' }} onClick={() => setShowDropdown(false)}>Dashboard</Link>
                      <Link to={`/agent/${address}`} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex' }} onClick={() => setShowDropdown(false)}>My Profile</Link>
                      <div className="divider" style={{ margin:'4px 0' }} />
                      <button className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',color:'var(--red)' }} onClick={() => { disconnect(); setShowDropdown(false) }}>Disconnect</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setShowWallet(true)}>Connect</button>
            )}

            <button className="btn btn-ghost btn-sm show-mobile" onClick={() => setMobileOpen(o=>!o)} style={{ padding:'7px 8px' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {mobileOpen ? <><path d="M3 3l12 12"/><path d="M15 3L3 15"/></> : <><path d="M2 5h14"/><path d="M2 9h14"/><path d="M2 13h14"/></>}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ borderTop:'1px solid var(--border)',background:'var(--bg-2)',padding:'6px 20px 12px' }}>
            {NAV.map(n => (
              <Link key={n.path} to={n.path} style={{ display:'block',textDecoration:'none',fontSize:15,fontWeight:500,padding:'11px 4px',color:location.pathname===n.path?'var(--accent)':'var(--text)',borderBottom:'1px solid var(--border)' }} onClick={() => setMobileOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      <style>{`
        @media (max-width: 640px) { .hide-mobile { display: none !important; } }
        @media (min-width: 641px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  )
}
