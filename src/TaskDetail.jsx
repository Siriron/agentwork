import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Avatar, Name, Address, Identity } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { TASK_REGISTRY_ABI } from './contracts'
import { useNetwork } from './NetworkContext'
import { useToast } from './Toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_BADGE = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
const STATUS_LABEL = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000) - Number(ts)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}
function timeLeft(deadline) {
  const diff = Number(deadline)*1000 - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff/3600000)
  return h < 24 ? `${h}h left` : `${Math.floor(h/24)}d left`
}

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n}
          className={`star ${n <= value ? 'star-filled' : 'star-empty'}`}
          onClick={() => !readonly && onChange?.(n)}
          style={{ cursor: readonly ? 'default' : 'pointer' }}>★</span>
      ))}
    </div>
  )
}

function ActionBox({ title, sponsored, children }) {
  return (
    <div style={{ padding:16, background:'var(--bg-3)', borderRadius:10, border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{title}</span>
        {sponsored && <span className="sponsored-badge">⛽ Gasless</span>}
      </div>
      {children}
    </div>
  )
}

// ── Single-write hook — avoids stale closure bug ──────────────────────────────
function useTxn(functionName, contractAddress) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const exec = (args, value) => {
    reset() // clear previous error/hash before new tx
    writeContract({
      address: contractAddress,
      abi: TASK_REGISTRY_ABI,
      functionName,
      args,
      gas: 500_000n,
      ...(value !== undefined ? { value } : {}),
    })
  }

  return { exec, isPending, confirming, isSuccess, error, hash }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskDetail() {
  const { id }      = useParams()
  const taskId      = BigInt(id || '0')
  const { address, isConnected } = useAccount()
  const { CONTRACTS, tokenByAddress, formatAmount, isTestnet } = useNetwork()
  const toast = useToast()

  const [proposal,    setProposal]    = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [rating,      setRating]      = useState(0)
  const [assigningIdx, setAssigningIdx] = useState(null)

  // ── Reads ──
  const { data: core, refetch: refetchCore } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskCore', args: [taskId],
    query: { enabled: !!id && taskId > 0n },
  })
  const { data: meta } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskMeta', args: [taskId],
    query: { enabled: !!id && taskId > 0n },
  })
  const { data: bids, refetch: refetchBids } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskBids', args: [taskId],
    query: { enabled: !!id && taskId > 0n },
  })

  // ── Writes ──
  const bidW     = useTxn('bidOnTask',        CONTRACTS.TASK_REGISTRY)
  const assignW  = useTxn('assignTask',       CONTRACTS.TASK_REGISTRY)
  const submitW  = useTxn('submitWork',       CONTRACTS.TASK_REGISTRY)
  const attestW  = useTxn('attestCompletion', CONTRACTS.TASK_REGISTRY)
  const cancelW  = useTxn('cancelTask',       CONTRACTS.TASK_REGISTRY)
  const disputeW = useTxn('disputeTask',      CONTRACTS.TASK_REGISTRY)
  const releaseW = useTxn('autoRelease',      CONTRACTS.TASK_REGISTRY)

  // ── Toast + refetch on success ──
  useEffect(() => {
    if (bidW.isSuccess)     { toast('Bid placed!', 'success');      setProposal('');    refetchBids() }
  }, [bidW.isSuccess])
  useEffect(() => {
    if (assignW.isSuccess)  { toast('Agent assigned!', 'success');  setAssigningIdx(null); refetchCore(); refetchBids() }
  }, [assignW.isSuccess])
  useEffect(() => {
    if (submitW.isSuccess)  { toast('Work submitted!', 'success');  setDeliverable(''); refetchCore() }
  }, [submitW.isSuccess])
  useEffect(() => {
    if (attestW.isSuccess)  { toast('Bounty released!', 'success'); refetchCore() }
  }, [attestW.isSuccess])
  useEffect(() => {
    if (cancelW.isSuccess)  { toast('Task cancelled.', 'success');  refetchCore() }
  }, [cancelW.isSuccess])
  useEffect(() => {
    if (disputeW.isSuccess) { toast('Dispute raised.', 'success');  refetchCore() }
  }, [disputeW.isSuccess])
  useEffect(() => {
    if (releaseW.isSuccess) { toast('Bounty auto-released!', 'success'); refetchCore() }
  }, [releaseW.isSuccess])

  // ── Handlers ──
  const handleBid     = () => { if (!proposal.trim()) return; bidW.exec([taskId, proposal]) }
  const handleAssign  = (idx) => { setAssigningIdx(idx); assignW.exec([taskId, BigInt(idx)]) }
  const handleSubmit  = () => { if (!deliverable.trim()) return; submitW.exec([taskId, deliverable]) }
  const handleAttest  = () => { if (!rating) return; attestW.exec([taskId, rating]) }
  const handleCancel  = () => cancelW.exec([taskId])
  const handleDispute = () => disputeW.exec([taskId])
  const handleRelease = () => releaseW.exec([taskId])

  // ── Loading ──
  if (!core || !meta) return (
    <div className="container" style={{ paddingTop:40, paddingBottom:80 }}>
      <div className="skeleton" style={{ height:28, width:120, borderRadius:6, marginBottom:24 }}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="skeleton" style={{ height:200, borderRadius:14 }}/>
          <div className="skeleton" style={{ height:120, borderRadius:14 }}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="skeleton" style={{ height:100, borderRadius:14 }}/>
          <div className="skeleton" style={{ height:160, borderRadius:14 }}/>
        </div>
      </div>
      <style>{`@media(max-width:768px){.tdetail-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )

  // ── Derived state ──
  const token          = tokenByAddress(core.token)
  const status         = Number(core.status)
  const isPoster       = !!address && address.toLowerCase() === core.poster?.toLowerCase()
  const isAssigned     = !!address && address.toLowerCase() === core.assignedAgent?.toLowerCase()
  const hasAlreadyBid  = !!address && bids?.some(b => b.agent?.toLowerCase() === address.toLowerCase())
  const scanBase       = isTestnet ? 'https://sepolia.basescan.org' : 'https://basescan.org'
  const nowSec         = Date.now() / 1000
  const disputeOpen    = status === 2 && Number(core.submittedAt) > 0 && nowSec <= Number(core.submittedAt) + 48*3600
  const autoReleaseOk  = status === 2 && Number(core.submittedAt) > 0 && nowSec >= Number(core.submittedAt) + 7*86400
  const bountyFmt      = formatAmount(core.bounty, core.token)
  const payoutFmt      = (Number(bountyFmt) * 0.98).toFixed(token?.decimals === 18 ? 5 : 2)

  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80 }}>
      <Link to="/tasks" style={{ fontSize:13, color:'var(--text-3)', textDecoration:'none', display:'inline-block', marginBottom:24 }}>
        ← Back
      </Link>

      <div className="tdetail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>

        {/* ── Left column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>

          {/* Task header */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14, flexWrap:'wrap' }}>
              <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:22, color:'var(--text)', letterSpacing:'-0.04em' }}>{bountyFmt}</span>
                <span className="token-pill">{token?.icon} {token?.symbol}</span>
              </div>
            </div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'var(--text)', lineHeight:1.35, marginBottom:14, letterSpacing:'-0.02em' }}>
              {meta.title}
            </h1>
            <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.85, whiteSpace:'pre-wrap' }}>
              {meta.description}
            </p>
            <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, background:'var(--bg-3)', padding:'3px 8px', borderRadius:6, color:'var(--text-2)', textTransform:'capitalize' }}>{meta.category}</span>
              <span style={{ fontSize:11, color:'var(--text-3)' }}>⏱ {timeLeft(core.deadline)}</span>
              <span style={{ fontSize:11, color:'var(--text-3)' }}>Posted {timeAgo(core.createdAt)}</span>
              <span style={{ fontSize:11, color:'var(--text-3)' }}>#{id}</span>
            </div>
          </div>

          {/* Deliverable */}
          {meta.deliverableHash && (
            <div className="card">
              <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Deliverable</div>
              <div className="mono" style={{ fontSize:12, background:'var(--bg-3)', padding:12, borderRadius:8, wordBreak:'break-all', color:'var(--text-2)', lineHeight:1.7 }}>
                {meta.deliverableHash.startsWith('http') || meta.deliverableHash.startsWith('ipfs')
                  ? <a href={meta.deliverableHash.startsWith('ipfs') ? `https://ipfs.io/ipfs/${meta.deliverableHash.replace('ipfs://','')}`  : meta.deliverableHash}
                      target="_blank" rel="noreferrer" style={{ color:'var(--blue)', textDecoration:'none' }}>
                      {meta.deliverableHash} ↗
                    </a>
                  : meta.deliverableHash}
              </div>
              {Number(meta.completedAt) > 0 && (
                <p style={{ fontSize:11, color:'var(--text-3)', marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
                  Completed {timeAgo(meta.completedAt)}
                  {core.posterRating > 0 && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      · <StarRating value={Number(core.posterRating)} readonly />
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Proposals */}
          <div className="card">
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>
              Proposals ({bids?.length || 0})
            </div>
            {!bids || bids.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No proposals yet</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {bids.map((bid, i) => (
                  <div key={i} style={{ padding:14, background: bid.selected ? 'var(--green-dim)' : 'var(--bg-3)', borderRadius:10, border:`1px solid ${bid.selected ? 'var(--green)' : 'var(--border)'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar address={bid.agent} chain={base} style={{ width:22, height:22, borderRadius:'50%', flexShrink:0 }}/>
                        <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>
                          <Name address={bid.agent} chain={base}/>
                        </span>
                        {bid.selected && <span style={{ fontSize:10, fontWeight:700, color:'var(--green)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Assigned</span>}
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>{timeAgo(bid.bidAt)}</span>
                        {isPoster && status === 0 && !bid.selected && (
                          <button className="btn btn-success btn-sm"
                            onClick={() => handleAssign(i)}
                            disabled={assignW.isPending || assignW.confirming}>
                            {assignW.isPending && assigningIdx === i ? 'Confirming…'
                              : assignW.confirming && assigningIdx === i ? 'Assigning…'
                              : 'Assign'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.75, marginBottom:8 }}>{bid.proposal}</p>
                    <a href={`${scanBase}/address/${bid.agent}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, color:'var(--text-3)', textDecoration:'none', fontFamily:'var(--font-mono)' }}>
                      {bid.agent.slice(0,8)}…{bid.agent.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Poster card */}
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Posted by</div>
            <Identity address={core.poster} chain={base} hasCopyAddressOnClick>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar style={{ width:34, height:34, borderRadius:'50%', flexShrink:0 }}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><Name/></div>
                  <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis' }}><Address/></div>
                </div>
              </div>
            </Identity>
            <Link to={`/agent/${core.poster}`} style={{ display:'block', fontSize:11, color:'var(--text-3)', textDecoration:'none', marginTop:10 }}>
              View agent profile →
            </Link>
          </div>

          {/* Task info */}
          <div className="card" style={{ padding:14 }}>
            {[
              { label:'Bounty',       value:`${bountyFmt} ${token?.symbol}` },
              { label:'Agent payout', value:`${payoutFmt} ${token?.symbol}` },
              { label:'Protocol fee', value:'2%' },
              { label:'Deadline',     value:new Date(Number(core.deadline)*1000).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) },
              { label:'Posted',       value:new Date(Number(core.createdAt)*1000).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) },
              { label:'Proposals',    value:bids?.length || 0 },
            ].map((r,i,arr) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', fontSize:12 }}>
                <span style={{ color:'var(--text-3)' }}>{r.label}</span>
                <span style={{ fontWeight:500, color:'var(--text)' }}>{r.value}</span>
              </div>
            ))}
            <a href={`${scanBase}/address/${CONTRACTS.TASK_REGISTRY}`} target="_blank" rel="noreferrer"
              className="btn btn-secondary btn-sm" style={{ width:'100%', marginTop:12, fontSize:11 }}>
              View contract ↗
            </a>
          </div>

          {/* ── Action panels ── */}
          {!isConnected && (
            <div style={{ padding:14, background:'var(--bg-3)', borderRadius:10, border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', textAlign:'center', lineHeight:1.7 }}>
              Connect your wallet to place a bid or manage this task
            </div>
          )}

          {isConnected && (
            <>
              {/* Bid */}
              {!isPoster && status === 0 && !hasAlreadyBid && (
                <ActionBox title="Place a bid" sponsored>
                  <textarea className="input"
                    placeholder="Describe your approach, experience, and timeline…"
                    value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    rows={4}
                    style={{ marginBottom:10, resize:'vertical', minHeight:90 }}/>
                  <button className="btn btn-primary btn-full" onClick={handleBid}
                    disabled={!proposal.trim() || bidW.isPending || bidW.confirming}>
                    {bidW.isPending ? 'Confirm in wallet…'
                      : bidW.confirming ? <><span className="spinner"/>&nbsp;Submitting…</>
                      : 'Submit proposal'}
                  </button>
                  {bidW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {bidW.error.shortMessage || bidW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}

              {/* Already bid */}
              {!isPoster && hasAlreadyBid && status === 0 && (
                <div style={{ padding:12, background:'var(--blue-dim)', border:'1px solid var(--blue)', borderRadius:10, fontSize:13, color:'var(--blue)', lineHeight:1.6 }}>
                  ✓ Proposal submitted — waiting for the poster to assign
                </div>
              )}

              {/* Submit work */}
              {isAssigned && status === 1 && (
                <ActionBox title="Submit work" sponsored>
                  <input className="input"
                    placeholder="IPFS hash, GitHub link, or deliverable URL…"
                    value={deliverable}
                    onChange={e => setDeliverable(e.target.value)}
                    style={{ marginBottom:10 }}/>
                  <button className="btn btn-primary btn-full" onClick={handleSubmit}
                    disabled={!deliverable.trim() || submitW.isPending || submitW.confirming}>
                    {submitW.isPending ? 'Confirm in wallet…'
                      : submitW.confirming ? <><span className="spinner"/>&nbsp;Submitting…</>
                      : 'Submit deliverable'}
                  </button>
                  {submitW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {submitW.error.shortMessage || submitW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}

              {/* Approve work */}
              {isPoster && status === 2 && (
                <ActionBox title="Approve work">
                  <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:12, lineHeight:1.7 }}>
                    Review the deliverable, rate the work, and release the bounty.
                  </p>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Rating</div>
                    <StarRating value={rating} onChange={setRating}/>
                  </div>
                  <button className="btn btn-success btn-full" onClick={handleAttest}
                    disabled={!rating || attestW.isPending || attestW.confirming}>
                    {attestW.isPending ? 'Confirm in wallet…'
                      : attestW.confirming ? <><span className="spinner"/>&nbsp;Releasing…</>
                      : 'Approve & release bounty'}
                  </button>
                  {attestW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {attestW.error.shortMessage || attestW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}

              {/* Dispute */}
              {isPoster && status === 2 && disputeOpen && (
                <ActionBox title="Dispute" sponsored>
                  <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:10, lineHeight:1.7 }}>
                    Work doesn't meet requirements? Raise a dispute within 48h. An admin will review and decide.
                  </p>
                  <button className="btn btn-danger btn-full" onClick={handleDispute}
                    disabled={disputeW.isPending || disputeW.confirming}>
                    {disputeW.isPending ? 'Confirm in wallet…'
                      : disputeW.confirming ? <><span className="spinner"/>&nbsp;Submitting…</>
                      : 'Raise dispute'}
                  </button>
                  {disputeW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {disputeW.error.shortMessage || disputeW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}

              {/* Cancel */}
              {isPoster && status === 0 && (!bids || bids.length === 0) && (
                <ActionBox title="Cancel task">
                  <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:10, lineHeight:1.7 }}>
                    No bids yet. Cancel and receive a full refund.
                  </p>
                  <button className="btn btn-danger btn-full" onClick={handleCancel}
                    disabled={cancelW.isPending || cancelW.confirming}>
                    {cancelW.isPending ? 'Confirm in wallet…'
                      : cancelW.confirming ? <><span className="spinner"/>&nbsp;Cancelling…</>
                      : 'Cancel & refund'}
                  </button>
                  {cancelW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {cancelW.error.shortMessage || cancelW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}

              {/* Auto-release */}
              {status === 2 && autoReleaseOk && (
                <ActionBox title="Auto-release">
                  <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:10, lineHeight:1.7 }}>
                    7 days have passed with no response. Anyone can release the bounty to the agent.
                  </p>
                  <button className="btn btn-secondary btn-full" onClick={handleRelease}
                    disabled={releaseW.isPending || releaseW.confirming}>
                    {releaseW.isPending ? 'Confirm in wallet…'
                      : releaseW.confirming ? <><span className="spinner"/>&nbsp;Releasing…</>
                      : 'Trigger auto-release'}
                  </button>
                  {releaseW.error && (
                    <p style={{ fontSize:11, color:'var(--red)', marginTop:8 }}>
                      {releaseW.error.shortMessage || releaseW.error.message}
                    </p>
                  )}
                </ActionBox>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .tdetail-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
