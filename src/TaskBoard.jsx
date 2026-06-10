import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { CONTRACTS, TASK_REGISTRY_ABI, TASK_CATEGORIES } from './contracts'

const STATUS_BADGE = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
const STATUS_LABEL = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }

function fmt(n) { return (Number(n)/1e6).toFixed(2) }
function addr(a) { return a?`${a.slice(0,6)}…${a.slice(-4)}`:'' }
function timeLeft(d) {
  const diff = Number(d) - Math.floor(Date.now()/1000)
  if (diff<=0) return 'Expired'
  const days=Math.floor(diff/86400), hrs=Math.floor((diff%86400)/3600)
  return days>0?`${days}d ${hrs}h`:hrs>0?`${hrs}h`:`${Math.floor((diff%3600)/60)}m`
}

function TaskRow({ id }) {
  const { data: core } = useReadContract({ address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI, functionName: 'getTaskCore', args: [BigInt(id)] })
  const { data: meta } = useReadContract({ address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI, functionName: 'getTaskMeta', args: [BigInt(id)] })

  if (!core || !meta) return <div className="skeleton" style={{ height:60,borderRadius:8,marginBottom:1 }}/>

  const status = Number(core.status)

  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration:'none',display:'block' }}>
      <div style={{ display:'flex',alignItems:'center',gap:16,padding:'14px 0',borderBottom:'1px solid var(--border)',cursor:'pointer' }}
        onMouseEnter={e=>e.currentTarget.style.opacity='0.75'}
        onMouseLeave={e=>e.currentTarget.style.opacity='1'}
      >
        {/* Title + meta */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:14,fontWeight:500,color:'var(--text)',letterSpacing:'-0.01em',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {meta.title}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,color:'var(--text-3)',textTransform:'capitalize' }}>{meta.category}</span>
            <span style={{ color:'var(--border-2)',fontSize:10 }}>·</span>
            <span style={{ fontSize:12,color:'var(--text-3)' }}>{timeLeft(core.deadline)}</span>
            <span style={{ color:'var(--border-2)',fontSize:10 }}>·</span>
            <span className="mono" style={{ fontSize:11,color:'var(--text-3)' }}>{addr(core.poster)}</span>
          </div>
        </div>

        {/* Status + bounty */}
        <div style={{ display:'flex',alignItems:'center',gap:14,flexShrink:0 }}>
          <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          <div style={{ textAlign:'right',minWidth:64 }}>
            <div style={{ fontSize:14,fontWeight:600,color:'var(--text)',letterSpacing:'-0.02em' }}>${fmt(core.bounty)}</div>
            <div style={{ fontSize:11,color:'var(--text-3)' }}>USDC</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function TaskBoard() {
  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getOpenTaskIds',
    args: [BigInt(0), BigInt(50)],
  })

  const ids = data?.[0] ?? []
  const total = data?.[1] ? Number(data[1]) : 0

  return (
    <div className="container" style={{ paddingTop:36,paddingBottom:80 }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,gap:16,flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:4 }}>Task Board</h1>
          <p style={{ fontSize:13,color:'var(--text-3)' }}>
            {isLoading ? 'Loading…' : `${total} open task${total!==1?'s':''} · Base mainnet`}
          </p>
        </div>
        <Link to="/post" className="btn btn-primary">Post Task</Link>
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:8,marginBottom:4,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:'1 1 180px',maxWidth:260 }}>
          <svg style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)' }} width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="5.5" cy="5.5" r="3.5"/><path d="M9 9l2 2"/></svg>
          <input className="input" style={{ paddingLeft:28,height:34,fontSize:12 }} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
          {['all',...TASK_CATEGORIES].map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ padding:'4px 10px',borderRadius:99,fontSize:11,fontWeight:500,cursor:'pointer',border:'1px solid', borderColor:cat===c?'var(--text-3)':'var(--border)', background:'transparent', color:cat===c?'var(--text)':'var(--text-3)', transition:'all 0.15s',textTransform:'capitalize' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ borderTop:'1px solid var(--border)' }}>
        {isLoading ? (
          Array.from({length:5}).map((_,i)=><div key={i} className="skeleton" style={{ height:60,marginTop:1,borderRadius:0 }}/>)
        ) : ids.length === 0 ? (
          <div style={{ textAlign:'center',padding:'64px 0' }}>
            <div style={{ fontSize:13,color:'var(--text-3)',marginBottom:16 }}>No open tasks yet</div>
            <Link to="/post" className="btn btn-primary">Be the first to post</Link>
          </div>
        ) : (
          ids.map(id=><TaskRow key={id.toString()} id={id.toString()}/>)
        )}
      </div>
    </div>
  )
}
