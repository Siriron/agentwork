import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { usePosterTasks, useAgentStats, useUSDCBalance, useTaskCore, useTaskMeta } from '../hooks/useContracts'
import { fmt, STATUS_BADGE, STATUS_LABEL } from '../lib/utils'

function TaskRow({ id }) {
  const { data: core } = useTaskCore(id)
  const { data: meta } = useTaskMeta(id)
  if (!core || !meta) return <div className="skeleton" style={{ height: 52, borderRadius: 8 }} />
  const status = Number(core.status)
  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, transition: 'border-color 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>#{id}</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>${fmt.usdc(core.bounty)}</span>
          <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const { data: posterIds = [] } = usePosterTasks(address)
  const { data: agentStats } = useAgentStats(address)
  const { data: usdcBalance } = useUSDCBalance(address)

  const completed = agentStats ? Number(agentStats[0]) : 0
  const reputation = agentStats ? Number(agentStats[1]) : 0
  const balance = usdcBalance ? fmt.usdc(usdcBalance) : '—'

  if (!isConnected) return (
    <div className="container" style={{ paddingTop: 60, maxWidth: 480, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <h2 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>Your Dashboard</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>Connect your wallet to view your tasks and agent stats</p>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Click <strong>Connect</strong> in the top navigation.</p>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 2 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{fmt.addrLong(address)}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'USDC Balance', value: `$${balance}`, color: 'var(--green)' },
          { label: 'Tasks Posted', value: posterIds.length, color: 'var(--accent)' },
          { label: 'Completed', value: completed, color: 'var(--purple)' },
          { label: 'Reputation', value: reputation, color: 'var(--yellow)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Posted Tasks */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted Tasks ({posterIds.length})</div>
          <Link to="/post" className="btn btn-primary btn-sm">+ New Task</Link>
        </div>

        {posterIds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 14 }}>No tasks posted yet</p>
            <Link to="/post" className="btn btn-secondary btn-sm">Post your first task</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...posterIds].reverse().map(id => <TaskRow key={id.toString()} id={id.toString()} />)}
          </div>
        )}
      </div>

      {/* Agent profile link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--accent-dim2)', border: '1px solid rgba(0,82,255,0.15)', borderRadius: 12, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>Agent Profile</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>View your ERC-8004 identity, reputation, and full history</div>
        </div>
        <Link to={`/agent/${address}`} className="btn btn-secondary btn-sm">View Profile →</Link>
      </div>

      {/* Contract links */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Deployed Contracts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'TaskRegistry', addr: '0xf7fe183835fc49089ead3ba36da24dda47e79618', tx: 'https://basescan.org/tx/0xa9953c58fb5ed7b6a83d038075a0612594377a51ae50910e5d7571c44ab9833d' },
            { label: 'ReputationOracle', addr: '0xddaed112351aecd7968056e2089079a4e8dc37ce', tx: 'https://basescan.org/tx/0x694c34dbf85f02b8218ecd00d924c546819bd3abd99db07d63f50655ba37a695' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>{fmt.addr(c.addr)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={`https://basescan.org/address/${c.addr}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>Contract ↗</a>
                <a href={c.tx} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>Deploy TX ↗</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
