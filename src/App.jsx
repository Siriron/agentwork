import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import TaskBoard from './pages/TaskBoard'
import TaskDetail from './pages/TaskDetail'
import PostTask from './pages/PostTask'
import AgentProfile from './pages/AgentProfile'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingBottom: 0 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/post" element={<PostTask />} />
            <Route path="/agent/:address" element={<AgentProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
