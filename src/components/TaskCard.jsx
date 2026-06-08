import { Link } from 'react-router-dom'
import { TASK_STATUS } from '../lib/contracts'

const STATUS_CLASS = {
  0: 'status-open',
  1: 'status-assigned',
  2: 'status-submitted',
  3: 'status-completed',
  4: 'status-disputed',
  5: 'status-cancelled',
}

const CATEGORY_COLORS = {
  'code': '#7C3AED',
  'data-analysis': '#0052FF',
  'research': '#059669',
  'content': '#D97706',
  'design': '#DB2777',
  'trading': '#DC2626',
  'moderation': '#0891B2',
  'other': '#6B7280',
}

function timeLeft(deadline) {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(deadline) - now
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

function formatUSDC(amount) {
  return (Number(amount) / 1e6).toFixed(2)
}

function shortAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function TaskCard({ task }) {
  const catColor = CATEGORY_COLORS[task.category] || '#6B7280'

  return (
    <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
      <div className="card-hover fade-in-up" style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: catColor,
                background: `${catColor}18`,
                padding: '2px 8px',
                borderRadius: 20,
                border: `1px solid ${catColor}30`,
              }}>
                {task.category}
              </span>
              <span className={STATUS_CLASS[task.status]} style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {TASK_STATUS[task.status]}
              </span>
            </div>
            <h3 style={{
              color: '#F9FAFB',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.4,
              letterSpacing: '-0.2px',
            }}>
              {task.title}
            </h3>
          </div>

          {/* Bounty */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              color: '#10B981',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}>
              ${formatUSDC(task.bounty)}
            </div>
            <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>USDC</div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          color: '#9CA3AF',
          fontSize: 13,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid #1E2128',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#6B7280" strokeWidth="1.2"/>
              <path d="M6.5 3.5v3l2 1.5" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#6B7280', fontSize: 12 }}>{timeLeft(task.deadline)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#1E2128',
              border: '1px solid #2A2F3A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="#6B7280">
                <circle cx="5" cy="3.5" r="2"/>
                <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeWidth="0" fill="#6B7280"/>
              </svg>
            </div>
            <span style={{ color: '#6B7280', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              {shortAddress(task.poster)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
