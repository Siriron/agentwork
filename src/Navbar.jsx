import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { useTheme } from './ThemeContext'

function SunIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="2.8"/><path d="M7.5 1v1M7.5 13v1M1 7.5h1M13 7.5h1M3.2 3.2l.7.7M11.1 11.1l.7.7M11.1 3.2l-.7.7M3.2 11.1l-.7.7"/></svg>
}
function MoonIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12.5 9A5.5 5.5 0 016 2.5a5.5 5.5 0 000 10 5.5 5.5 0 006.5-3.5z"/></svg>
}

function WalletModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()
  const LABELS = { injected:'Browser Wallet', coinbaseWallet:'Coinbase Wallet', walletConnect:'WalletConnect' }
  const ICONS  = { injected:'🦊', coinbaseWallet:'🔵', walletConnect:'🔗' }
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:14,padding:24,width:'100%',maxWidth:340 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <span className="serif" style={{ fontWeight:700,fontSize:17,color:'var(--text)' }}>Connect wallet</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'3px 8px' }}>✕</button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
          {connectors.map(c=>(
            <button key={c.uid} onClick={()=>{connect({connector:c});onClose()}} disabled={isPending}
              className="btn btn-secondary" style={{ justifyContent:'flex-start',padding:'11px 14px',gap:12 }}>
              <span style={{ fontSize:19 }}>{ICONS[c.id]||'💼'}</span>
              <span>{LABELS[c.id]||c.name}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize:11,color:'var(--text-3)',textAlign:'center',marginTop:14,lineHeight:1.6 }}>Any EVM wallet · Base mainnet</p>
      </div>
    </div>
  )
}

const NAV = [
  { label:'Tasks',     path:'/tasks' },
  { label:'Post Task', path:'/post' },
  { label:'Dashboard', path:'/dashboard' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [modal,  setModal]  = useState(false)
  const [drop,   setDrop]   = useState(false)
  const [mobile, setMobile] = useState(false)

  return (
    <>
      <nav style={{ borderBottom:'1px solid var(--border)',background:'var(--bg)',position:'sticky',top:0,zIndex:50 }}>
        <div className="container" style={{ height:54,display:'flex',alignItems:'center' }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:8,marginRight:28,flexShrink:0 }}>
            <div style={{ width:24,height:24,borderRadius:6,background:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L12 4.2v4.6L6.5 12 1 8.8V4.2L6.5 1z" stroke="var(--bg)" strokeWidth="1.3" fill="none"/>
                <circle cx="6.5" cy="6.5" r="1.9" fill="var(--bg)"/>
              </svg>
            </div>
            <span className="serif" style={{ fontWeight:700,fontSize:15,color:'var(--text)' }}>AgentWork</span>
          </Link>

          {/* Desktop links */}
          <div className="hide-mobile" style={{ display:'flex',gap:2,flex:1 }}>
            {NAV.map(n=>(
              <Link key={n.path} to={n.path} style={{ textDecoration:'none',fontSize:13,padding:'5px 12px',borderRadius:6,
                color:pathname===n.path?'var(--text)':'var(--text-3)',
                background:pathname===n.path?'var(--bg-3)':'transparent',
                fontWeight:pathname===n.path?500:400, transition:'all 0.15s' }}>
                {n.label}
              </Link>
            ))}
          </div>

          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:4 }}>
            {/* Theme */}
            <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ padding:'6px 7px',color:'var(--text-3)' }}>
              {theme==='dark'?<SunIcon/>:<MoonIcon/>}
            </button>

            {/* Wallet */}
            {isConnected ? (
              <div style={{ position:'relative' }}>
                <button onClick={()=>setDrop(d=>!d)} className="btn btn-secondary btn-sm" style={{ gap:6,fontFamily:'monospace',fontSize:12 }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',flexShrink:0 }}/>
                  {address?.slice(0,6)}…{address?.slice(-4)}
                </button>
                {drop&&(
                  <>
                    <div style={{ position:'fixed',inset:0,zIndex:55 }} onClick={()=>setDrop(false)}/>
                    <div style={{ position:'absolute',top:'calc(100% + 5px)',right:0,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:10,padding:5,minWidth:170,zIndex:60,boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
                      <Link to="/dashboard" onClick={()=>setDrop(false)} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex',color:'var(--text-2)' }}>Dashboard</Link>
                      <Link to={`/agent/${address}`} onClick={()=>setDrop(false)} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',display:'flex',color:'var(--text-2)' }}>My Profile</Link>
                      <div className="divider" style={{ margin:'4px 0' }}/>
                      <button onClick={()=>{disconnect();setDrop(false)}} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start',color:'var(--red)' }}>Disconnect</button>
                    </div>
                  </>
                )}
              </div>
            ):(
              <button onClick={()=>setModal(true)} className="btn btn-primary btn-sm">Connect</button>
            )}

            {/* Hamburger */}
            <button onClick={()=>setMobile(o=>!o)} className="btn btn-ghost btn-sm show-mobile" style={{ padding:'6px 7px' }}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {mobile?<><path d="M2 2l13 13"/><path d="M15 2L2 15"/></>:<><path d="M2 4h13"/><path d="M2 8.5h13"/><path d="M2 13h13"/></>}
              </svg>
            </button>
          </div>
        </div>

        {mobile&&(
          <div style={{ borderTop:'1px solid var(--border)',background:'var(--bg-2)',padding:'6px 24px 14px' }}>
            {NAV.map(n=>(
              <Link key={n.path} to={n.path} onClick={()=>setMobile(false)} style={{ display:'block',padding:'11px 4px',fontSize:14,color:pathname===n.path?'var(--text)':'var(--text-2)',textDecoration:'none',borderBottom:'1px solid var(--border)',fontWeight:pathname===n.path?500:400 }}>
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {modal&&<WalletModal onClose={()=>setModal(false)}/>}
    </>
  )
}
