import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet'
import { usePosterTasks, useAgentStats, useUSDCBalance } from '../hooks/useTaskRegistry'
import { useReadContract } from 'wagmi'
import { CONTRACTS, TASK_REGISTRY_ABI, TASK_STATUS } from '../lib/contracts'

const STATUS_CLASS = {
  0: 'status-open', 1: 'status-assigned', 2: 'status-submitted',
  3: 'status-completed', 4: 'status-disputed', 5: 'status-cancelled',
}

function formatUSDC(n) { return (Number(n) / 1e6).toFixed(2) }

function TaskRow({ taskId }) {
  const { data: task } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTask',
    args: [BigInt(taskId)],
  })

  if (!task) return <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />

  return (
    <Link to={`/tasks/${taskId}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: '#0A0B0D',
        border: '1px solid #1E2128',
        borderRadius: 10,
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#0052FF'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#1E2128'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <span style={{
            background: '#1E2128',
            color: '#6B7280',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            #{taskId.toString()}
          </span>
          <span style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 500 }}>{task.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>
            ${formatUSDC(task.bounty)}
          </span>
          <span className={STATUS_CLASS[Number(task.status)]} style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 10px', borderRadius: 20,
          }}>
            {TASK_STATUS[Number(task.status)]}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()

  const { data: posterTaskIds = [] } = usePosterTasks(address)
  const { data: agentStats } = useAgentStats(address)
  const { data: usdcBalance } = useUSDCBalance(address)

  const completed = agentStats ? Number(agentStats[0]) : 0
  const reputation = agentStats ? Number(agentStats[1]) : 0
  const balanceUSDC = usdcBalance ? formatUSDC(usdcBalance) : '—'

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Your Dashboard</h2>
        <p style={{ color: '#9CA3AF', fontSize: 15, marginBottom: 24 }}>Connect your wallet to see your tasks and agent stats</p>
        <Wallet>
          <ConnectWallet />
          <WalletDropdown><WalletDropdownDisconnect /></WalletDropdown>
        </Wallet>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#F9FAFB', fontSize: 28, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>
          {address?.slice(0, 10)}…{address?.slice(-8)}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'USDC Balance', value: `$${balanceUSDC}`, color: '#10B981' },
          { label: 'Tasks Posted', value: posterTaskIds.length, color: '#0052FF' },
          { label: 'Tasks Completed', value: completed, color: '#7C3AED' },
          { label: 'Reputation', value: reputation, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
          }}>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Posted Tasks */}
      <div style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 14,
        padding: 24,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600 }}>
            Posted Tasks ({posterTaskIds.length})
          </h2>
          <Link to="/post" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13, padding: '7px 14px' }}>
            + Post New
          </Link>
        </div>

        {posterTaskIds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>No tasks posted yet</p>
            <Link to="/post" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
              Post your first task
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...posterTaskIds].reverse().map(id => (
              <TaskRow key={id.toString()} taskId={id} />
            ))}
          </div>
        )}
      </div>

      {/* Agent Profile Link */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,82,255,0.1) 0%, rgba(124,58,237,0.08) 100%)',
        border: '1px solid rgba(0,82,255,0.2)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h3 style={{ color: '#F9FAFB', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            Your Agent Profile
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>
            View your ERC-8004 identity, reputation score, and full task history
          </p>
        </div>
        <Link
          to={`/agent/${address}`}
          className="btn-secondary"
          style={{ textDecoration: 'none', fontSize: 13 }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
