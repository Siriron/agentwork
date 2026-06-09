import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOpenTaskIds, useTaskCore, useTaskMeta } from '../hooks/useContracts'
import { fmt, CATEGORY_COLORS, STATUS_BADGE, STATUS_LABEL } from '../lib/utils'
import { TASK_CATEGORIES } from '../lib/contracts'

function TaskRow({ id }) {
  const { data: core } = useTaskCore(id)
  const { data: meta } = useTaskMeta(id)

  if (!core || !meta) return (
    <div className="skeleton" style={{ height: 88, borderRadius: 10 }} />
  )

  const catColor = CATEGORY_COLORS[meta.category] || '#71717a'
  const status = Number(core.status)

  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover fade-up" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>

        {/* Category dot */}
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${catColor}18`, border: `1px solid ${catColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: catColor }} />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {meta.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: catColor, textTransform: 'capitalize' }}>{meta.category}</span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmt.timeLeft(core.deadline)}</span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.addr(core.poster)}</span>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>${fmt.usdc(core.bounty)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>USDC</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <h3 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 6 }}>No tasks yet</h3>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>Be the first to post a task for AI agents on Base</p>
      <Link to="/post" className="btn btn-primary">Post a Task</Link>
    </div>
  )
}

export default function TaskBoard() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useOpenTaskIds(0, 50)
  const ids = data?.[0] ?? []
  const total = data?.[1] ? Number(data[1]) : 0

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>Task Board</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>
            {isLoading ? 'Loading…' : `${total} open task${total !== 1 ? 's' : ''} · Base mainnet`}
          </p>
        </div>
        <Link to="/post" className="btn btn-primary btn-sm">+ Post Task</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M10 10l2.5 2.5"/></svg>
          <input className="input" style={{ paddingLeft: 32, height: 36, fontSize: 13 }} placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', ...TASK_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid',
              borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
              background: category === cat ? 'var(--accent-dim)' : 'transparent',
              color: category === cat ? 'var(--accent)' : 'var(--text-2)',
              transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol info bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {[
          { label: 'Contracts', value: 'Verified', link: 'https://basescan.org/address/0xf7fe183835fc49089ead3ba36da24dda47e79618' },
          { label: 'Network', value: 'Base Mainnet' },
          { label: 'Payment', value: 'USDC · x402' },
          { label: 'Identity', value: 'ERC-8004' },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, padding: '10px 16px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
            {item.link
              ? <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>{item.value} ↗</a>
              : <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{item.value}</div>
            }
          </div>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
        </div>
      ) : ids.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ids.map(id => <TaskRow key={id.toString()} id={id.toString()} />)}
        </div>
      )}
    </div>
  )
}
