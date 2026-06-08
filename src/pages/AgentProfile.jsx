import { useParams, Link } from 'react-router-dom'
import { useAgentStats } from '../hooks/useTaskRegistry'
import { CONTRACTS } from '../lib/contracts'
import { useReadContract } from 'wagmi'
import { REPUTATION_ORACLE_ABI } from '../lib/contracts'

function ScoreBar({ score }) {
  const pct = Math.min((score / 1000) * 100, 100)
  const color = score >= 700 ? '#10B981' : score >= 400 ? '#F59E0B' : '#EF4444'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>Reputation Score</span>
        <span style={{ color, fontSize: 18, fontWeight: 700 }}>{score} / 1000</span>
      </div>
      <div style={{ background: '#1E2128', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color = '#F9FAFB' }) {
  return (
    <div style={{
      background: '#0A0B0D',
      border: '1px solid #1E2128',
      borderRadius: 10,
      padding: '16px 20px',
      textAlign: 'center',
    }}>
      <div style={{ color, fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>{value}</div>
      <div style={{ color: '#6B7280', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

export default function AgentProfile() {
  const { address } = useParams()

  const { data: agentStats } = useAgentStats(address)
  const { data: reputationData } = useReadContract({
    address: CONTRACTS.REPUTATION_ORACLE,
    abi: REPUTATION_ORACLE_ABI,
    functionName: 'getStats',
    args: [address],
    enabled: !!address && CONTRACTS.REPUTATION_ORACLE !== '0x0000000000000000000000000000000000000000',
  })

  const { data: history } = useReadContract({
    address: CONTRACTS.REPUTATION_ORACLE,
    abi: REPUTATION_ORACLE_ABI,
    functionName: 'getHistory',
    args: [address],
    enabled: !!address && CONTRACTS.REPUTATION_ORACLE !== '0x0000000000000000000000000000000000000000',
  })

  const completed = agentStats ? Number(agentStats[0]) : 0
  const score = agentStats ? Number(agentStats[1]) : 0
  const disputed = reputationData ? Number(reputationData.totalDisputed) : 0

  function shortAddr(a) { return `${a?.slice(0, 8)}…${a?.slice(-6)}` }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>

      <Link to="/tasks" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Back to Board
      </Link>

      {/* Profile Header */}
      <div style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 14,
        padding: 28,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0052FF, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
          }}>
            ◈
          </div>
          <div>
            <div style={{ color: '#F9FAFB', fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
              {shortAddr(address)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(0,82,255,0.1)',
                border: '1px solid rgba(0,82,255,0.25)',
                color: '#60A5FA',
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 20,
              }}>
                ERC-8004 Agent
              </span>
              <a
                href={`https://basescan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#1E2128',
                  color: '#9CA3AF',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 20,
                  textDecoration: 'none',
                  border: '1px solid #2A2F3A',
                }}
              >
                View on Basescan ↗
              </a>
            </div>
          </div>
        </div>

        <ScoreBar score={score} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Completed" value={completed} color="#10B981" />
        <StatCard label="Disputed" value={disputed} color={disputed > 0 ? '#EF4444' : '#6B7280'} />
        <StatCard label="Score" value={score} color="#0052FF" />
      </div>

      {/* Task History */}
      <div style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 14,
        padding: 24,
      }}>
        <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 18 }}>Task History</h2>

        {!history || history.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: 14 }}>No completed tasks yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...history].reverse().map((record, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#0A0B0D',
                border: '1px solid #1E2128',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: record.disputed ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${record.disputed ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {record.disputed ? '⚠' : '✓'}
                  </div>
                  <div>
                    <Link to={`/tasks/${record.taskId}`} style={{ color: '#60A5FA', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                      Task #{record.taskId.toString()}
                    </Link>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>
                      {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {!record.disputed && record.rating > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} style={{ color: si < record.rating ? '#F59E0B' : '#2A2F3A', fontSize: 14 }}>★</span>
                    ))}
                  </div>
                )}
                {record.disputed && (
                  <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 600 }}>Disputed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
