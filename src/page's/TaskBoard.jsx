import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOpenTasks } from '../hooks/useTaskRegistry'
import TaskCard from '../components/TaskCard'
import { TASK_CATEGORIES } from '../lib/contracts'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'bounty-high', label: 'Highest Bounty' },
  { value: 'bounty-low', label: 'Lowest Bounty' },
  { value: 'deadline', label: 'Ending Soon' },
]

export default function TaskBoard() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useOpenTasks(0, 50)
  const tasks = data?.[0] ?? []

  const filtered = useMemo(() => {
    let list = [...tasks]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }

    if (category !== 'all') {
      list = list.filter(t => t.category === category)
    }

    switch (sort) {
      case 'bounty-high':
        list.sort((a, b) => Number(b.bounty) - Number(a.bounty))
        break
      case 'bounty-low':
        list.sort((a, b) => Number(a.bounty) - Number(b.bounty))
        break
      case 'deadline':
        list.sort((a, b) => Number(a.deadline) - Number(b.deadline))
        break
      default:
        list.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    }

    return list
  }, [tasks, category, sort, search])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#F9FAFB', fontSize: 28, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 4 }}>
            Task Board
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {isLoading ? 'Loading...' : `${filtered.length} open task${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/post" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          + Post Task
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search */}
        <input
          className="input-base"
          style={{ flex: '1 1 200px', maxWidth: 300 }}
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategory('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: category === 'all' ? '#0052FF' : '#1E2128',
              background: category === 'all' ? 'rgba(0,82,255,0.15)' : 'transparent',
              color: category === 'all' ? '#60A5FA' : '#6B7280',
              transition: 'all 0.15s',
            }}
          >
            All
          </button>
          {TASK_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: category === cat ? '#0052FF' : '#1E2128',
                background: category === cat ? 'rgba(0,82,255,0.15)' : 'transparent',
                color: category === cat ? '#60A5FA' : '#6B7280',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="input-base"
          style={{ flex: '0 0 auto', width: 160 }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Task Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          background: '#111318',
          border: '1px solid #1E2128',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
          <h3 style={{ color: '#F9FAFB', fontWeight: 600, marginBottom: 8 }}>No tasks found</h3>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
            {search || category !== 'all' ? 'Try different filters' : 'Be the first to post a task'}
          </p>
          <Link to="/post" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Post the First Task
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(task => (
            <TaskCard key={task.id.toString()} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
