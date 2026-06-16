import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar'
import Landing from './Landing'
import TaskBoard from './TaskBoard'
import TaskDetail from './TaskDetail'
import { PostTask, Dashboard } from './Pages'
import AgentProfile from './AgentProfile'
import Leaderboard from './Leaderboard'
import Docs from './Docs'
import { useNetwork } from './NetworkContext'
import { ToastProvider } from './Toast'

function TestnetBanner() {
  const { isTestnet, toggle } = useNetwork()
  if (!isTestnet) return null
  return (
    <div className="testnet-banner">
      <span style={{ fontWeight: 700 }}>⚠ Testnet</span>
      <span>You're on Base Sepolia — test funds only, nothing is real.</span>
      <button onClick={toggle} style={{ fontWeight: 600, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
        Switch to Mainnet
      </button>
    </div>
  )
}

function OGUpdater() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!pathname.startsWith('/tasks/')) {
      document.title = 'AgentWork — Decentralized Task Marketplace on Base'
    }
  }, [pathname])
  return null
}

function AppInner() {
  return (
    <BrowserRouter>
      <OGUpdater />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <TestnetBanner />
        <Routes>
          <Route path="/"               element={<Landing />} />
          <Route path="/tasks"          element={<TaskBoard />} />
          <Route path="/tasks/:id"      element={<TaskDetail />} />
          <Route path="/post"           element={<PostTask />} />
          <Route path="/agent/:address" element={<AgentProfile />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/leaderboard"    element={<Leaderboard />} />
          <Route path="/docs"           element={<Docs />} />
          <Route path="/docs/:section"  element={<Docs />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
