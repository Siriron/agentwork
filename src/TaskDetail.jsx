import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, TASK_REGISTRY_ABI } from './contracts'

const STATUS_BADGE = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
const STATUS_LABEL = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }

function fmt(n) { return (Number(n)/1e6).toFixed(2) }
function addr(a) { return a?`${a.slice(0,6)}…${a.slice(-4)}`:'' }
function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000)-Number(ts)
  if(s<60) return 'just now'
  if(s<3600) return `${Math.floor(s/60)}m ago`
  if(s<86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}
function timeLeft(d) {
  const diff=Number(d)-Math.floor(Date.now()/1000)
  if(diff<=0) return 'Expired'
  const days=Math.floor(diff/86400),hrs=Math.floor((diff%86400)/3600)
  return days>0?`${days}d ${hrs}h left`:hrs>0?`${hrs}h left`:`${Math.floor((diff%3600)/60)}m left`
}

function useWrite(fn) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const exec = (args) => writeContract({ address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI, functionName: fn, args })
  return { exec, isPending, confirming, isSuccess, error }
}

function Row({ label, value }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:13,color:'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{value}</span>
    </div>
  )
}

export default function TaskDetail() {
  const { id } = useParams()
  const { address } = useAccount()

  const { data: core, isLoading } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getTaskCore',args:[BigInt(id||0)],query:{enabled:!!id} })
  const { data: meta } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getTaskMeta',args:[BigInt(id||0)],query:{enabled:!!id} })
  const { data: bids=[] } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getTaskBids',args:[BigInt(id||0)],query:{enabled:!!id} })

  const [proposal, setProposal] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [rating, setRating] = useState(5)

  const bidW     = useWrite('bidOnTask')
  const assignW  = useWrite('assignTask')
  const submitW  = useWrite('submitWork')
  const attestW  = useWrite('attestCompletion')
  const cancelW  = useWrite('cancelTask')
  const disputeW = useWrite('disputeTask')

  if (isLoading) return <div className="container" style={{ paddingTop:40 }}><div className="skeleton" style={{ height:280,borderRadius:12 }}/></div>
  if (!core || core.id===BigInt(0)) return (
    <div className="container" style={{ paddingTop:60,textAlign:'center' }}>
      <p style={{ color:'var(--text-3)',marginBottom:16 }}>Task not found</p>
      <Link to="/tasks" className="btn btn-secondary btn-sm">← Back</Link>
    </div>
  )

  const status   = Number(core.status)
  const isPoster = address?.toLowerCase()===core.poster?.toLowerCase()
  const isAgent  = address?.toLowerCase()===core.assignedAgent?.toLowerCase()
  const hasBid   = bids.some(b=>b.agent?.toLowerCase()===address?.toLowerCase())

  return (
    <div className="container" style={{ paddingTop:28,paddingBottom:80 }}>
      <Link to="/tasks" style={{ fontSize:13,color:'var(--text-3)',textDecoration:'none',display:'inline-block',marginBottom:24 }}>← Tasks</Link>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:24,alignItems:'start' }}>

        {/* Left */}
        <div>
          {/* Header */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap' }}>
              <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
              <span style={{ fontSize:12,color:'var(--text-3)',textTransform:'capitalize' }}>{meta?.category}</span>
              <span className="mono" style={{ fontSize:11,color:'var(--text-3)' }}>#{id}</span>
            </div>
            <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)',fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:14 }}>{meta?.title}</h1>
            <p style={{ fontSize:14,color:'var(--text-2)',lineHeight:1.75 }}>{meta?.description}</p>
            {meta?.deliverableHash && (
              <div className="mono" style={{ marginTop:14,padding:'10px 14px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12,color:'var(--text-2)',wordBreak:'break-all' }}>
                Deliverable: {meta.deliverableHash}
              </div>
            )}
          </div>

          <div className="divider" style={{ marginBottom:24 }}/>

          {/* Bids */}
          <div style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:14,letterSpacing:'-0.01em' }}>Bids ({bids.length})</h2>

            {bids.length===0 ? (
              <p style={{ fontSize:13,color:'var(--text-3)' }}>No bids yet.</p>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {bids.map((b,i)=>(
                  <div key={i} style={{ padding:'14px 16px',background:'var(--bg-2)',border:`1px solid ${b.selected?'var(--green)':'var(--border)'}`,borderRadius:8 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:6 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <Link to={`/agent/${b.agent}`} className="mono" style={{ fontSize:12,color:'var(--text-2)',textDecoration:'none' }}>{addr(b.agent)}</Link>
                        {b.selected && <span className="badge badge-open" style={{ fontSize:10 }}>Assigned</span>}
                      </div>
                      <span style={{ fontSize:12,color:'var(--text-3)' }}>{timeAgo(b.bidAt)}</span>
                    </div>
                    <p style={{ fontSize:13,color:'var(--text-2)',lineHeight:1.65 }}>{b.proposal}</p>
                    {isPoster && status===0 && !b.selected && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop:10 }} onClick={()=>assignW.exec([BigInt(id),BigInt(i)])} disabled={assignW.isPending||assignW.confirming}>
                        {assignW.isPending||assignW.confirming ? 'Assigning…' : 'Assign'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit bid */}
            {status===0 && !isPoster && !hasBid && address && (
              <div style={{ marginTop:20,paddingTop:20,borderTop:'1px solid var(--border)' }}>
                <h3 style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:10 }}>Submit a bid</h3>
                <textarea className="input" placeholder="Describe your approach and timeline…" value={proposal} onChange={e=>setProposal(e.target.value)} rows={4} style={{ marginBottom:10,resize:'vertical' }}/>
                <button className="btn btn-primary" onClick={()=>bidW.exec([BigInt(id),proposal])} disabled={!proposal.trim()||bidW.isPending||bidW.confirming}>
                  {bidW.isPending ? 'Confirm…' : bidW.confirming ? 'Submitting…' : bidW.isSuccess ? '✓ Bid submitted' : 'Submit bid'}
                </button>
              </div>
            )}
            {status===0 && !address && (
              <p style={{ fontSize:13,color:'var(--text-3)',marginTop:14 }}>Connect your wallet to bid.</p>
            )}
          </div>

          {/* Agent: submit work */}
          {isAgent && status===1 && (
            <div style={{ paddingTop:20,borderTop:'1px solid var(--border)' }}>
              <h3 style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:6 }}>Submit deliverable</h3>
              <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:12 }}>Upload to IPFS and paste the hash.</p>
              <input className="input" placeholder="ipfs://Qm… or bafybe…" value={deliverable} onChange={e=>setDeliverable(e.target.value)} style={{ marginBottom:10 }}/>
              <button className="btn btn-primary btn-full" onClick={()=>submitW.exec([BigInt(id),deliverable])} disabled={!deliverable.trim()||submitW.isPending||submitW.confirming}>
                {submitW.isPending ? 'Confirm…' : submitW.confirming ? 'Submitting…' : 'Submit work'}
              </button>
            </div>
          )}

          {/* Poster: attest */}
          {isPoster && status===2 && (
            <div style={{ paddingTop:20,borderTop:'1px solid var(--border)' }}>
              <h3 style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:6 }}>Release payment</h3>
              <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:14 }}>
                Review the deliverable above. Approving releases <strong style={{ color:'var(--green)' }}>${fmt(core.bounty*BigInt(98)/BigInt(100))} USDC</strong> to the agent.
              </p>
              <div style={{ marginBottom:14 }}>
                <div className="label">Rate the agent</div>
                <div style={{ display:'flex',gap:6 }}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>setRating(n)} style={{ width:34,height:34,borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:15, border:`1px solid ${rating>=n?'var(--yellow)':'var(--border)'}`, background:rating>=n?'var(--yellow-dim)':'transparent', color:rating>=n?'var(--yellow)':'var(--text-3)', transition:'all 0.15s' }}>★</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-full" style={{ background:'var(--green)',color:'#fff',fontWeight:600 }} onClick={()=>attestW.exec([BigInt(id),rating])} disabled={attestW.isPending||attestW.confirming}>
                {attestW.isPending ? 'Confirm…' : attestW.confirming ? 'Releasing…' : attestW.isSuccess ? '✓ Payment released' : `Approve & release $${fmt(core.bounty*BigInt(98)/BigInt(100))}`}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>

          {/* Bounty */}
          <div className="card" style={{ textAlign:'center',padding:'20px 16px' }}>
            <div style={{ fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>Bounty</div>
            <div style={{ fontSize:30,fontWeight:700,color:'var(--text)',letterSpacing:'-1px',lineHeight:1 }}>${fmt(core.bounty)}</div>
            <div style={{ fontSize:12,color:'var(--text-3)',marginTop:4 }}>USDC · Escrowed</div>
          </div>

          {/* Details */}
          <div className="card" style={{ padding:'16px 18px' }}>
            <Row label="Status" value={STATUS_LABEL[status]}/>
            <Row label="Deadline" value={timeLeft(core.deadline)}/>
            <Row label="Posted" value={timeAgo(core.createdAt)}/>
            <Row label="Bids" value={bids.length}/>
            <div style={{ paddingTop:10 }}>
              <div className="label">Posted by</div>
              <Link to={`/agent/${core.poster}`} className="mono" style={{ fontSize:12,color:'var(--text-2)',textDecoration:'none' }}>{addr(core.poster)}</Link>
            </div>
          </div>

          {/* Links */}
          <div className="card" style={{ padding:'14px 18px',display:'flex',flexDirection:'column',gap:8 }}>
            <a href={`https://basescan.org/address/${CONTRACTS.TASK_REGISTRY}`} target="_blank" rel="noreferrer" style={{ fontSize:13,color:'var(--text-2)',textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-2)'}>
              View contract ↗
            </a>
            <a href={`https://basescan.org/address/${core.poster}`} target="_blank" rel="noreferrer" style={{ fontSize:13,color:'var(--text-2)',textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--text-2)'}>
              View poster ↗
            </a>
          </div>

          {/* Danger */}
          {isPoster && status===0 && (
            <button className="btn btn-full" style={{ background:'transparent',border:'1px solid var(--border)',color:'var(--red)',fontSize:13 }} onClick={()=>cancelW.exec([BigInt(id)])} disabled={cancelW.isPending||cancelW.confirming}>
              {cancelW.isPending||cancelW.confirming ? 'Cancelling…' : 'Cancel & refund'}
            </button>
          )}
          {(isPoster||isAgent) && (status===1||status===2) && (
            <button className="btn btn-full" style={{ background:'transparent',border:'1px solid var(--border)',color:'var(--red)',fontSize:13 }} onClick={()=>disputeW.exec([BigInt(id)])} disabled={disputeW.isPending}>
              {disputeW.isPending ? 'Disputing…' : 'Raise dispute'}
            </button>
          )}
        </div>
      </div>

      <style>{`@media(max-width:720px){.task-detail-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
