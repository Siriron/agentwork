import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { useTheme } from './ThemeContext'

function SunIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7" cy="7" r="2.5"/><path d="M7 1v1M7 12v1M1 7h1M12 7h1M3 3l.7.7M10.3 10.3l.7.7M10.3 3l-.7.7M3 10.3l-.7.7"/></svg>
}
function MoonIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 8.5A5 5 0 015.5 2.5a5 5 0 000 9 5 5 0 006-3z"/></svg>
}

function WalletModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()
  const LABELS = {
    injected: 'Browser Wallet',
    coinbaseWallet: 'Coinbase Wallet',
    walletConnect: 'WalletConnect',
  }
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(2px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:12,padding:24,width:'100%',maxWidth:340 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <span style={{ fontWeight:600,fontSize:15,color:'var(--text)',letterSpacing:'-0.02em' }}>Connect wallet</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'3px 8px',color:'var(--text-3)' }}>✕</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {connectors.map(c => (
            <button key={c.uid} onClick={()=>{connect({connector:c});onClose()}} disabled={isPending}
              className="btn btn-secondary" style={{ justifyContent:'flex-start',padding:'10px 14px',gap:10 }}>
              <span style={{ fontSize:18 }}>{c.id==='injected'?'🦊':c.id==='coinbaseWallet'?'🔵':'🔗'}</span>
              <span>{LABELS[c.id]||c.name}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize:11,color:'var(--text-3)',textAlign:'center',marginTop:14,lineHeight:1.6 }}>
          Any EVM wallet works · Base mainnet only
        </p>
      </div>
    </div>
  )
}

const NAV = [
  { label: 'Tasks', path: '/tasks' },
  { label: 'Post Task', path: '/post' },
  { label: 'Dashboard', path: '/dashboard' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [modal, setModal] = useState(false)
  const [drop, setDrop] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav style={{ borderBottom:'1px solid var(--border)',background:'var(--bg)',position:'sticky',top:0,zIndex:50 }}>
        <div className="container" style={{ height:52,display:'flex',alignItems:'center',gap:0 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:7,marginRight:28,flexShrink:0 }}>
            <div style={{ width:22,height:22,borderRadius:5,background:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 3.8v4.4L6 11 1 8.2V3.8L6 1z" stroke="var(--bg)" strokeWidth="1.3" fill="none"/>
                <circle cx="6" cy="6" r="1.8" fill="var(--bg)"/>
              </svg>
            </div>
            <span style={{ fontWeight:600,fontSize:14,color:'var(--text)',letterSpacing:'-0.02em' }}>AgentWork</span>
          </Link>

          {/* Nav links */}
          <div className="hide-mobile" style={{ display:'flex',gap:0,flex:1 }}>
            {NAV.map(n => (
              <Link key={n.path} to={n.path} style={{
                textDecoration:'none',fontSize:13,padding:'5px 12px',borderRadius:6,
                color: pathname===n.path ? 'var(--text)' : 'var(--text-3)',
                background: pathname===n.path ? 'var(--bg-3)' : 'transparent',
                transition:'all 0.15s', fontWeight: pathname===n.path ? 500 : 400,
              }}>
                {n.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:4 }}>

            {/* Theme toggle */}
            <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ padding:'6px 7px',color:'var(--text-3)' }} title="Toggle theme">
              {theme==='dark' ? <SunIcon/> : <MoonIcon/>}
            </button>

            {/* Wallet */}
            {isConnected ? (
              <div style={{ position:'relative' }}>
                <button onClick={()=>setDrop(d=>!d)} className="btn btn-secondary btn-sm" style={{ gap:6,fontFamily:'monospace',fontSize:12,letterSpacing:0 }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',flexShrink:0 }}/>
                  {address?.slice(0,6)}…{address?.slice(-4)}
                </button>
                {drop && (
                  <>
                    <div style={{ position:'fixed',inset:0,zIndex:55 }} onClick={()=>setDrop(false)}/>
                    <div style={{ position:'absolute',top:'calc(100% + 5px)',right:0,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:10,padding:5,minWidth:170,zIndex:60 }}>
                      <Link to="/dashboard" onClick={()=>setDrop(false)} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex',color:'var(--text-2)' }}>Dashboard</Link>
                      <Link to={`/agent/${address}`} onClick={()=>setDrop(false)} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex',color:'var(--text-2)' }}>My Profile</Link>
                      <div className="divider" style={{ margin:'4px 0' }}/>
                      <button onClick={()=>{disconnect();setDrop(false)}} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',color:'var(--red)' }}>Disconnect</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={()=>setModal(true)} className="btn btn-primary btn-sm">Connect</button>
            )}

            {/* Mobile hamburger */}
            <button onClick={()=>setMobileOpen(o=>!o)} className="btn btn-ghost btn-sm show-mobile" style={{ padding:'6px 7px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {mobileOpen?<><path d="M2 2l12 12"/><path d="M14 2L2 14"/></>:<><path d="M2 4h12"/><path d="M2 8h12"/><path d="M2 12h12"/></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ borderTop:'1px solid var(--border)',background:'var(--bg-2)',padding:'6px 16px 12px' }}>
            {NAV.map(n=>(
              <Link key={n.path} to={n.path} onClick={()=>setMobileOpen(false)} style={{ display:'block',padding:'10px 4px',fontSize:14,color:pathname===n.path?'var(--text)':'var(--text-2)',textDecoration:'none',borderBottom:'1px solid var(--border)',fontWeight:pathname===n.path?500:400 }}>
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {modal && <WalletModal onClose={()=>setModal(false)}/>}
    </>
  )
}
