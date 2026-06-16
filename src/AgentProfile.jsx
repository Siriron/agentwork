import { useParams, Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { Avatar, Name, Address, Badge, Identity } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { TASK_REGISTRY_ABI, REPUTATION_ORACLE_ABI } from './contracts'
import { useNetwork } from './NetworkContext'

function ScoreBar({ value, color }) {
  return (
    <div style={{ height:6, background:'var(--bg-3)', borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min((value/1000)*100,100)}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }}/>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ textAlign:'center', padding:'16px 12px' }}>
      <div style={{ fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing:'-0.05em', marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--text-3)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function timeAgo(ts) {
  if (!ts || ts === 0n || Number(ts) === 0) return 'Never'
  const s = Math.floor(Date.now()/1000) - Number(ts)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function StarRow({ rating }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize:12, color: n <= rating ? 'var(--amber)' : 'var(--border)' }}>★</span>
      ))}
    </div>
  )
}

export default function AgentProfile() {
  const { address } = useParams()
  const { CONTRACTS, isTestnet } = useNetwork()

  const { data: rank } = useReadContract({
    address: CONTRACTS.REPUTATION_ORACLE, abi: REPUTATION_ORACLE_ABI,
    functionName: 'getAgentRank', args: [address],
    query: { enabled: !!address },
  })
  const { data: history = [] } = useReadContract({
    address: CONTRACTS.REPUTATION_ORACLE, abi: REPUTATION_ORACLE_ABI,
    functionName: 'getHistory', args: [address],
    query: { enabled: !!address },
  })
  const { data: agentBids = [] } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getAgentBids', args: [address],
    query: { enabled: !!address },
  })
  const { data: assigned = [] } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getAgentAssigned', args: [address],
    query: { enabled: !!address },
  })

  if (!address) return (
    <div className="container" style={{ paddingTop:60, textAlign:'center' }}>
      <p style={{ color:'var(--text-3)' }}>Invalid address.</p>
    </div>
  )

  const score      = rank ? Number(rank[0]) : 0
  const completed  = rank ? Number(rank[1]) : 0
  const disputed   = rank ? Number(rank[2]) : 0
  const avgRating  = rank && Number(rank[1]) > 0 ? (Number(rank[3]) / 100).toFixed(1) : '—'
  const lastActive = rank ? rank[4] : 0n

  const scoreColor = score >= 700 ? 'var(--green)' : score >= 400 ? 'var(--amber)' : score > 0 ? 'var(--red)' : 'var(--text-3)'
  const scoreLabel = score >= 700 ? 'Excellent' : score >= 400 ? 'Good' : score > 0 ? 'Building' : 'New'
  const scanBase   = isTestnet ? 'https://sepolia.basescan.org' : 'https://basescan.org'

  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80, maxWidth:760 }}>
      <Link to="/leaderboard" style={{ fontSize:13, color:'var(--text-3)', textDecoration:'none', display:'inline-block', marginBottom:24 }}>
        ← Leaderboard
      </Link>

      {/* Identity card */}
      <div className="card" style={{ marginBottom:20 }}>
        <Identity address={address} chain={base} hasCopyAddressOnClick>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <Avatar style={{ width:60, height:60, borderRadius:'50%', flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:20, color:'var(--text)', letterSpacing:'-0.02em', marginBottom:2 }}><Name/></div>
              <div style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-mono)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis' }}><Address/></div>
              <Badge/>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:38, fontWeight:700, color:scoreColor, letterSpacing:'-0.05em', lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:11, color:scoreColor, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{scoreLabel}</div>
              <div style={{ width:120, marginTop:8 }}><ScoreBar value={score} color={scoreColor}/></div>
            </div>
          </div>
        </Identity>

        <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
          <a href={`${scanBase}/address/${address}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Basescan ↗</a>
          <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(window.location.href) }}>
            Copy profile link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }} className="agent-stats">
        <StatCard label="Completed"   value={completed}/>
        <StatCard label="Disputed"    value={disputed}   sub={disputed > 0 ? '−50 pts each' : '✓ Clean'}/>
        <StatCard label="Avg rating"  value={avgRating}  sub="out of 5.0"/>
        <StatCard label="Last active" value={timeAgo(lastActive)}/>
      </div>

      {/* History */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>
          Task History ({history.length})
        </div>
        {history.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No completed tasks yet</p>
        ) : (
          <div>
            {[...history].reverse().map((h, i) => (
              <Link key={i} to={`/tasks/${h.taskId.toString()}`} style={{ textDecoration:'none', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)', gap:12, flexWrap:'wrap' }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>#{h.taskId.toString()}</span>
                  {h.disputed
                    ? <span className="badge badge-disputed">Disputed</span>
                    : <span className="badge badge-completed">Completed</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {!h.disputed && h.rating > 0 && <StarRow rating={Number(h.rating)}/>}
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>{timeAgo(h.timestamp)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity summary */}
      <div className="card">
        <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Activity</div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
          <span style={{ color:'var(--text-3)' }}>Total bids placed</span>
          <span style={{ fontWeight:500, color:'var(--text)' }}>{agentBids.length}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:13 }}>
          <span style={{ color:'var(--text-3)' }}>Tasks assigned</span>
          <span style={{ fontWeight:500, color:'var(--text)' }}>{assigned.length}</span>
        </div>
      </div>

      <style>{`
        @media(max-width:640px){
          .agent-stats{ grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
