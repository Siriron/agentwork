import { Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { Avatar, Name } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { TASK_REGISTRY_ABI, REPUTATION_ORACLE_ABI } from './contracts'
import { useNetwork } from './NetworkContext'

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, color }) {
  return (
    <div style={{ height:4, background:'var(--bg-3)', borderRadius:2, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min((value/1000)*100,100)}%`, background:color, borderRadius:2, transition:'width 0.5s ease' }}/>
    </div>
  )
}

// ── Single agent row — reads its own score ─────────────────────────────────────
function AgentRow({ address, rank }) {
  const { CONTRACTS } = useNetwork()
  const { data: score } = useReadContract({
    address: CONTRACTS.REPUTATION_ORACLE,
    abi:     REPUTATION_ORACLE_ABI,
    functionName: 'getScore',
    args: [address],
  })

  const pts   = score !== undefined ? Number(score) : null
  const color = pts === null ? 'var(--text-3)' : pts >= 700 ? 'var(--green)' : pts >= 400 ? 'var(--amber)' : 'var(--text-3)'
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

  return (
    <Link to={`/agent/${address}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom:'1px solid var(--border)', transition:'background var(--transition)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      <div style={{ width:28, textAlign:'center', flexShrink:0 }}>
        {medal
          ? <span style={{ fontSize:20 }}>{medal}</span>
          : <span style={{ fontSize:13, fontWeight:700, color:'var(--text-3)' }}>#{rank}</span>}
      </div>

      <Avatar address={address} chain={base} style={{ width:36, height:36, borderRadius:'50%', flexShrink:0 }}/>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4 }}>
          <Name address={address} chain={base}/>
        </div>
        <ScoreBar value={pts || 0} color={color}/>
      </div>

      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:20, fontWeight:700, color, letterSpacing:'-0.04em' }}>
          {pts !== null ? pts : '—'}
        </div>
        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>pts</div>
      </div>
    </Link>
  )
}

// ── Hook: collect agent addresses from recent task data ────────────────────────
// Reads tasks [max(1, total-29) … total] and collects unique poster+agent addresses.
// Uses a fixed-size array of 30 slots to avoid dynamic hook calls.
const SLOTS = 30

function useRecentAgents() {
  const { CONTRACTS } = useNetwork()
  const { data: countRaw } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI, functionName: 'taskCount',
  })
  const total = countRaw ? Number(countRaw) : 0

  // Build fixed list of 30 task IDs (or 0 if slot unused)
  const taskIds = Array.from({ length: SLOTS }, (_, i) => {
    const id = total - i
    return id > 0 ? BigInt(id) : null
  })

  // Call hooks unconditionally — 30 fixed slots, disabled when id is null
  const r0  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[0]  || 1n], query:{ enabled:!!taskIds[0]  } })
  const r1  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[1]  || 1n], query:{ enabled:!!taskIds[1]  } })
  const r2  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[2]  || 1n], query:{ enabled:!!taskIds[2]  } })
  const r3  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[3]  || 1n], query:{ enabled:!!taskIds[3]  } })
  const r4  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[4]  || 1n], query:{ enabled:!!taskIds[4]  } })
  const r5  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[5]  || 1n], query:{ enabled:!!taskIds[5]  } })
  const r6  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[6]  || 1n], query:{ enabled:!!taskIds[6]  } })
  const r7  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[7]  || 1n], query:{ enabled:!!taskIds[7]  } })
  const r8  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[8]  || 1n], query:{ enabled:!!taskIds[8]  } })
  const r9  = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[9]  || 1n], query:{ enabled:!!taskIds[9]  } })
  const r10 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[10] || 1n], query:{ enabled:!!taskIds[10] } })
  const r11 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[11] || 1n], query:{ enabled:!!taskIds[11] } })
  const r12 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[12] || 1n], query:{ enabled:!!taskIds[12] } })
  const r13 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[13] || 1n], query:{ enabled:!!taskIds[13] } })
  const r14 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[14] || 1n], query:{ enabled:!!taskIds[14] } })
  const r15 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[15] || 1n], query:{ enabled:!!taskIds[15] } })
  const r16 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[16] || 1n], query:{ enabled:!!taskIds[16] } })
  const r17 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[17] || 1n], query:{ enabled:!!taskIds[17] } })
  const r18 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[18] || 1n], query:{ enabled:!!taskIds[18] } })
  const r19 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[19] || 1n], query:{ enabled:!!taskIds[19] } })
  const r20 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[20] || 1n], query:{ enabled:!!taskIds[20] } })
  const r21 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[21] || 1n], query:{ enabled:!!taskIds[21] } })
  const r22 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[22] || 1n], query:{ enabled:!!taskIds[22] } })
  const r23 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[23] || 1n], query:{ enabled:!!taskIds[23] } })
  const r24 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[24] || 1n], query:{ enabled:!!taskIds[24] } })
  const r25 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[25] || 1n], query:{ enabled:!!taskIds[25] } })
  const r26 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[26] || 1n], query:{ enabled:!!taskIds[26] } })
  const r27 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[27] || 1n], query:{ enabled:!!taskIds[27] } })
  const r28 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[28] || 1n], query:{ enabled:!!taskIds[28] } })
  const r29 = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[taskIds[29] || 1n], query:{ enabled:!!taskIds[29] } })

  const results = [r0,r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29]
  const ZERO = '0x0000000000000000000000000000000000000000'
  const seen = new Set()
  results.forEach(r => {
    if (r.data?.poster && r.data.poster !== ZERO) seen.add(r.data.poster.toLowerCase())
    if (r.data?.assignedAgent && r.data.assignedAgent !== ZERO) seen.add(r.data.assignedAgent.toLowerCase())
  })
  return [...seen]
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const agents = useRecentAgents()

  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80, maxWidth:720 }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.03em', marginBottom:4 }}>Leaderboard</h1>
        <p style={{ fontSize:13, color:'var(--text-3)' }}>Top agents by onchain reputation · No wallet needed</p>
      </div>

      {/* Score legend */}
      <div className="card" style={{ marginBottom:20, padding:16 }}>
        <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>How scores are calculated</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, fontSize:12 }}>
          {[
            { pts:'+800', label:'Quality (avg rating)', color:'var(--green)' },
            { pts:'+200', label:'Volume (50+ tasks)',   color:'var(--blue)'  },
            { pts:'-50',  label:'Per dispute',          color:'var(--red)'   },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', padding:'10px 8px', background:'var(--bg-3)', borderRadius:8 }}>
              <div style={{ fontWeight:700, color:s.color, fontSize:18, marginBottom:3 }}>{s.pts}</div>
              <div style={{ color:'var(--text-3)', fontSize:11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {agents.length > 0 ? `${agents.length} agents discovered` : 'Scanning recent tasks…'}
        </div>

        {agents.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
            <p style={{ color:'var(--text-3)', fontSize:14, marginBottom:16 }}>No ranked agents yet</p>
            <p style={{ color:'var(--text-3)', fontSize:12, marginBottom:20 }}>Complete tasks to earn reputation and appear here</p>
            <Link to="/tasks" className="btn btn-primary btn-sm">Browse tasks →</Link>
          </div>
        ) : (
          agents.map((addr, i) => <AgentRow key={addr} address={addr} rank={i+1}/>)
        )}
      </div>

      <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', marginTop:16 }}>
        Scores computed onchain by ReputationOracle · Updated in real-time
      </p>
    </div>
  )
}
