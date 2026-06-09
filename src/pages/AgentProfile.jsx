import { useParams, Link } from 'react-router-dom'
import { useAgentStats, useRepStats, useRepHistory } from '../hooks/useContracts'
import { fmt } from '../lib/utils'

function ScoreBar({ score }) {
  const pct = Math.min((score / 1000) * 100, 100)
  const color = score >= 700 ? 'var(--green)' : score >= 400 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Reputation Score</span>
        <span style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.5px' }}>{score}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>/1000</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function AgentProfile() {
  const { address } = useParams()
  const { data: agentStats } = useAgentStats(address)
  const { data: repStats } = useRepStats(address)
  const { data: history = [] } = useRepHistory(address)

  const completed = agentStats ? Number(agentStats[0]) : 0
  const score = agentStats ? Number(agentStats[1]) : 0
  const disputed = repStats ? Number(repStats.totalDisputed) : 0

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 760 }}>

      <Link to="/" style={{ color: 'var(--text-3)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back</Link>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>◈</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {address}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(0,82,255,0.2)' }}>ERC-8004 Agent</span>
              <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                Basescan ↗
              </a>
            </div>
          </div>
        </div>
        <ScoreBar score={score} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Completed', value: completed, color: 'var(--green)' },
          { label: 'Disputed', value: disputed, color: disputed > 0 ? 'var(--red)' : 'var(--text-3)' },
          { label: 'Score', value: score, color: 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.8px', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Task History</div>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No completed tasks yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...history].reverse().map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.disputed ? 'var(--red-dim)' : 'var(--green-dim)', border: `1px solid ${r.disputed ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    {r.disputed ? '⚠' : '✓'}
                  </div>
                  <div>
                    <Link to={`/tasks/${r.taskId}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Task #{r.taskId.toString()}
                    </Link>
                    <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmt.date(r.timestamp)}</div>
                  </div>
                </div>
                {!r.disputed && r.rating > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} style={{ color: si < r.rating ? 'var(--yellow)' : 'var(--border-2)', fontSize: 14 }}>★</span>
                    ))}
                  </div>
                )}
                {r.disputed && <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>Disputed</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
