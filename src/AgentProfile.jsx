import { Link, useParams } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { CONTRACTS, TASK_REGISTRY_ABI, REPUTATION_ORACLE_ABI } from './contracts'

export default function AgentProfile() {
  const { address: agentAddr } = useParams()

  const { data: stats } = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getAgentStats', args:[agentAddr], query:{enabled:!!agentAddr} })
  const { data: repStats } = useReadContract({ address:CONTRACTS.REPUTATION_ORACLE, abi:REPUTATION_ORACLE_ABI, functionName:'getStats', args:[agentAddr], query:{enabled:!!agentAddr} })
  const { data: history=[] } = useReadContract({ address:CONTRACTS.REPUTATION_ORACLE, abi:REPUTATION_ORACLE_ABI, functionName:'getHistory', args:[agentAddr], query:{enabled:!!agentAddr} })

  const completed  = stats ? Number(stats[0]) : 0
  const score      = stats ? Number(stats[1]) : 0
  const disputed   = repStats ? Number(repStats.totalDisputed) : 0
  const pct        = Math.min((score/1000)*100, 100)
  const scoreColor = score>=700?'var(--green)':score>=400?'var(--yellow)':'var(--red)'

  return (
    <div className="container" style={{ paddingTop:28,paddingBottom:80,maxWidth:720 }}>
      <Link to="/tasks" style={{ fontSize:13,color:'var(--text-3)',textDecoration:'none',display:'inline-block',marginBottom:24 }}>← Back</Link>

      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20,flexWrap:'wrap' }}>
          <div style={{ width:44,height:44,borderRadius:'50%',background:'var(--bg-3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>◈</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div className="mono" style={{ fontSize:13,color:'var(--text)',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis' }}>{agentAddr}</div>
            <a href={`https://basescan.org/address/${agentAddr}`} target="_blank" rel="noreferrer" style={{ fontSize:11,color:'var(--text-3)',textDecoration:'none',border:'1px solid var(--border)',borderRadius:99,padding:'2px 8px' }}>Basescan ↗</a>
          </div>
        </div>
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
            <span style={{ fontSize:12,color:'var(--text-3)' }}>Reputation score</span>
            <span style={{ fontSize:14,fontWeight:700,color:scoreColor,letterSpacing:'-0.02em' }}>{score}<span style={{ fontSize:11,color:'var(--text-3)',fontWeight:400 }}>/1000</span></span>
          </div>
          <div style={{ height:4,background:'var(--bg-3)',borderRadius:99,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${pct}%`,background:scoreColor,borderRadius:99,transition:'width 0.8s ease' }}/>
          </div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12 }}>
        {[{label:'Completed',value:completed,color:'var(--green)'},{label:'Disputed',value:disputed,color:disputed>0?'var(--red)':'var(--text-3)'},{label:'Score',value:score,color:'var(--text)'}].map((s,i)=>(
          <div key={i} className="card" style={{ textAlign:'center',padding:'14px 12px' }}>
            <div style={{ fontSize:22,fontWeight:700,color:s.color,letterSpacing:'-0.05em',marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize:12,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14 }}>Task history</div>
        {history.length===0 ? (
          <p style={{ fontSize:13,color:'var(--text-3)' }}>No completed tasks yet.</p>
        ) : (
          <div>{[...history].reverse().map((r,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:14,color:r.disputed?'var(--red)':'var(--green)' }}>{r.disputed?'⚠':'✓'}</span>
                <div>
                  <Link to={`/tasks/${r.taskId}`} style={{ fontSize:13,fontWeight:500,color:'var(--text)',textDecoration:'none' }}>Task #{r.taskId.toString()}</Link>
                  <div style={{ fontSize:11,color:'var(--text-3)' }}>{new Date(Number(r.timestamp)*1000).toLocaleDateString()}</div>
                </div>
              </div>
              {!r.disputed&&r.rating>0 && <div>{Array.from({length:5}).map((_,si)=><span key={si} style={{ color:si<r.rating?'var(--yellow)':'var(--border-2)',fontSize:13 }}>★</span>)}</div>}
              {r.disputed && <span style={{ fontSize:12,color:'var(--red)',fontWeight:500 }}>Disputed</span>}
            </div>
          ))}</div>
        )}
      </div>
    </div>
  )
}
