import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { Name, Avatar } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { TASK_REGISTRY_ABI, TASK_CATEGORIES } from './contracts'
import { useNetwork } from './NetworkContext'

const STATUS_BADGE = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
const STATUS_LABEL = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }

function timeLeft(deadline) {
  const diff = Number(deadline)*1000 - Date.now()
  if (diff <= 0) return { text:'Expired', expired:true }
  const h = Math.floor(diff/3600000)
  return { text: h < 24 ? `${h}h left` : `${Math.floor(h/24)}d left`, expired:false }
}

function TaskCard({ id }) {
  const { CONTRACTS, tokenByAddress, formatAmount } = useNetwork()
  const { data: core } = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskCore', args:[BigInt(id)] })
  const { data: meta } = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskMeta', args:[BigInt(id)] })
  const { data: bids } = useReadContract({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'getTaskBids', args:[BigInt(id)] })

  if (!core || !meta) return <div className="card skeleton" style={{ height:148, borderRadius:14 }}/>

  const token  = tokenByAddress(core.token)
  const status = Number(core.status)
  const tl     = timeLeft(core.deadline)

  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration:'none', display:'block' }}>
      <div className="card" style={{ cursor:'pointer', height:'100%', transition:'border-color var(--transition)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <span className={`badge ${STATUS_BADGE[status]}`} style={{ marginBottom:6, display:'inline-block' }}>{STATUS_LABEL[status]}</span>
            <h3 style={{ fontSize:14, fontWeight:600, color:'var(--text)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {meta.title}
            </h3>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'-0.03em' }}>
              {formatAmount(core.bounty, core.token)}
            </div>
            <div className="token-pill" style={{ marginTop:4 }}>{token?.icon} {token?.symbol || '?'}</div>
          </div>
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.65, marginBottom:12, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {meta.description}
        </p>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
            <Avatar address={core.poster} chain={base} style={{ width:16, height:16, borderRadius:'50%', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>
              <Name address={core.poster} chain={base}/>
            </span>
          </div>
          <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text-3)', flexShrink:0 }}>
            <span>{bids?.length || 0} bids</span>
            <span style={{ color: tl.expired ? 'var(--red)' : 'var(--text-3)' }}>{tl.text}</span>
            <span style={{ background:'var(--bg-3)', padding:'1px 6px', borderRadius:4, textTransform:'capitalize' }}>{meta.category}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function TaskBoard() {
  const { CONTRACTS } = useNetwork()
  const [category, setCategory] = useState('all')
  const [search,   setSearch]   = useState('')

  const { data: result, isLoading } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getOpenTaskIds', args: [BigInt(0), BigInt(50)],
  })
  const { data: taskCount } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI, functionName: 'taskCount',
  })

  const allIds = useMemo(() => result?.[0] ? [...result[0]].reverse().map(n => n.toString()) : [], [result])

  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.03em', marginBottom:3 }}>Task Board</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>
            {taskCount !== undefined ? `${taskCount.toString()} tasks total` : 'Loading…'} · Browse without a wallet
          </p>
        </div>
        <Link to="/post" className="btn btn-primary">+ Post Task</Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom:14 }}>
        <input className="input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:320 }}/>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['all', ...TASK_CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform:'capitalize' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Sponsored note */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
        <span className="sponsored-badge">⛽ Gasless bidding</span>
        <span style={{ fontSize:12, color:'var(--text-3)' }}>Base Paymaster covers gas for bids and submissions</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:148, borderRadius:14 }}/>)}
        </div>
      ) : allIds.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <p style={{ color:'var(--text-3)', fontSize:14, marginBottom:20 }}>No open tasks yet</p>
          <Link to="/post" className="btn btn-primary">Post the first task</Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
          {allIds.map(id => <TaskCard key={id} id={id}/>)}
        </div>
      )}
    </div>
  )
}
