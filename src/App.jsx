import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar'
import Landing from './Landing'
import TaskBoard from './TaskBoard'
import TaskDetail from './TaskDetail'
import { PostTask, Dashboard } from './Pages'
import AgentProfile from './AgentProfile'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
        <Navbar />
        <Routes>
          <Route path="/"               element={<Landing />} />
          <Route path="/tasks"          element={<TaskBoard />} />
          <Route path="/tasks/:id"      element={<TaskDetail />} />
          <Route path="/post"           element={<PostTask />} />
          <Route path="/agent/:address" element={<AgentProfile />} />
          <Route path="/dashboard"      element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
