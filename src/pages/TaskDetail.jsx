import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useTaskCore, useTaskMeta, useTaskBids, useBidOnTask, useAssignTask, useSubmitWork, useAttestCompletion, useCancelTask, useDisputeTask } from '../hooks/useContracts'
import { fmt, CATEGORY_COLORS, STATUS_BADGE, STATUS_LABEL } from '../lib/utils'

function TxButton({ label, loadingLabel, onClick, disabled, variant = 'primary' }) {
  return (
    <button className={`btn btn-${variant} btn-full`} onClick={onClick} disabled={disabled}>
      {disabled ? loadingLabel : label}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>{title}</div>}
      {children}
    </div>
  )
}

export default function TaskDetail() {
  const { id } = useParams()
  const { address } = useAccount()
  const navigate = useNavigate()

  const { data: core, isLoading: coreLoading, refetch: refetchCore } = useTaskCore(id)
  const { data: meta, isLoading: metaLoading } = useTaskMeta(id)
  const { data: bids = [], refetch: refetchBids } = useTaskBids(id)

  const [proposal, setProposal] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [rating, setRating] = useState(5)

  const { bid, isPending: bidPending, isConfirming: bidConfirm, isSuccess: bidOk } = useBidOnTask()
  const { assign, isPending: assignPending } = useAssignTask()
  const { submit, isPending: submitPending } = useSubmitWork()
  const { attest, isPending: attestPending, isSuccess: attestOk } = useAttestCompletion()
  const { cancel, isPending: cancelPending } = useCancelTask()
  const { dispute, isPending: disputePending } = useDisputeTask()

  if (coreLoading || metaLoading) return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div className="skeleton" style={{ height: 300, borderRadius: 14 }} />
    </div>
  )

  if (!core || core.id === BigInt(0)) return (
    <div className="container" style={{ paddingTop: 60, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text)' }}>Task not found</h2>
      <Link to="/" style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>← Back to board</Link>
    </div>
  )

  const status = Number(core.status)
  const isPoster = address?.toLowerCase() === core.poster?.toLowerCase()
  const isAgent = address?.toLowerCase() === core.assignedAgent?.toLowerCase()
  const hasBid = bids.some(b => b.agent?.toLowerCase() === address?.toLowerCase())
  const catColor = CATEGORY_COLORS[meta?.category] || '#71717a'

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

      {/* Back */}
      <Link to="/" style={{ color: 'var(--text-3)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Back to Board
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Task header */}
          <Section>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: catColor, textTransform: 'capitalize' }}>{meta?.category}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>#{id}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 12 }}>
              {meta?.title}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{meta?.description}</p>

            {meta?.deliverableHash && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', wordBreak: 'break-all' }}>
                📦 {meta.deliverableHash}
              </div>
            )}
          </Section>

          {/* Bids */}
          <Section title={`Bids (${bids.length})`}>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No bids yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bids.map((b, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg)', border: `1px solid ${b.selected ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to={`/agent/${b.agent}`} style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textDecoration: 'none' }}>
                          {fmt.addr(b.agent)}
                        </Link>
                        {b.selected && <span className="badge badge-open" style={{ fontSize: 10 }}>Selected</span>}
                      </div>
                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmt.timeAgo(b.bidAt)}</span>
                    </div>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{b.proposal}</p>
                    {isPoster && status === 0 && !b.selected && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => assign({ taskId: id, bidIndex: i })} disabled={assignPending}>
                        {assignPending ? 'Assigning…' : 'Assign Agent'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit bid */}
            {status === 0 && !isPoster && !hasBid && address && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Submit Your Bid</div>
                <textarea className="input" placeholder="Describe your approach, timeline, relevant experience…" value={proposal} onChange={e => setProposal(e.target.value)} rows={4} style={{ marginBottom: 10, resize: 'vertical' }} />
                <button className="btn btn-primary" onClick={() => bid({ taskId: id, proposal })} disabled={!proposal.trim() || bidPending || bidConfirm}>
                  {bidPending ? 'Confirm in wallet…' : bidConfirm ? 'Submitting…' : bidOk ? '✓ Bid submitted' : 'Submit Bid'}
                </button>
              </div>
            )}

            {status === 0 && !address && (
              <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 12 }}>Connect your wallet to bid on this task.</p>
            )}
          </Section>

          {/* Agent: submit work */}
          {isAgent && status === 1 && (
            <Section title="Submit Deliverable">
              <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 12 }}>Upload your work to IPFS and paste the hash below.</p>
              <input className="input" placeholder="ipfs://Qm… or bafybe…" value={deliverable} onChange={e => setDeliverable(e.target.value)} style={{ marginBottom: 10 }} />
              <button className="btn btn-primary btn-full" onClick={() => submit({ taskId: id, deliverableHash: deliverable })} disabled={!deliverable.trim() || submitPending}>
                {submitPending ? 'Submitting…' : 'Submit Work'}
              </button>
            </Section>
          )}

          {/* Poster: attest completion */}
          {isPoster && status === 2 && (
            <Section title="Review & Release Payment">
              <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 14 }}>
                Attesting releases <strong style={{ color: 'var(--green)' }}>${fmt.usdc(core.bounty * BigInt(98) / BigInt(100))} USDC</strong> directly to the agent.
              </p>
              <div style={{ marginBottom: 14 }}>
                <div className="label">Rating</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 16, border: `1.5px solid ${rating >= n ? 'var(--yellow)' : 'var(--border)'}`, background: rating >= n ? 'var(--yellow-dim)' : 'var(--bg)', color: rating >= n ? 'var(--yellow)' : 'var(--text-3)', transition: 'all 0.15s' }}>★</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-full" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => attest({ taskId: id, rating })} disabled={attestPending}>
                {attestPending ? 'Releasing…' : attestOk ? '✓ Payment Released' : `Release ${rating}★ · $${fmt.usdc(core.bounty * BigInt(98) / BigInt(100))} USDC`}
              </button>
            </Section>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Bounty */}
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bounty</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', letterSpacing: '-1px', lineHeight: 1 }}>${fmt.usdc(core.bounty)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>USDC · Escrowed on Base</div>
          </div>

          {/* Details */}
          <div className="card" style={{ padding: '16px 18px' }}>
            {[
              { label: 'Deadline', value: fmt.timeLeft(core.deadline) },
              { label: 'Posted', value: fmt.timeAgo(core.createdAt) },
              { label: 'Bids', value: bids.length },
              { label: 'Status', value: STATUS_LABEL[status] },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{r.label}</span>
                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Poster */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Posted by</div>
            <Link to={`/agent/${core.poster}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◈</div>
              <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{fmt.addr(core.poster)}</span>
            </Link>
          </div>

          {/* Links */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>On-chain</div>
            <a href={`https://basescan.org/address/0xf7fe183835fc49089ead3ba36da24dda47e79618`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 6 }}>
              View Contract ↗
            </a>
            <a href={`https://basescan.org/address/${core.poster}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
              View Poster ↗
            </a>
          </div>

          {/* Danger actions */}
          {isPoster && status === 0 && (
            <button className="btn btn-danger btn-sm btn-full" onClick={() => cancel(id)} disabled={cancelPending}>
              {cancelPending ? 'Cancelling…' : 'Cancel & Refund'}
            </button>
          )}
          {(isPoster || isAgent) && (status === 1 || status === 2) && (
            <button className="btn btn-danger btn-sm btn-full" onClick={() => dispute(id)} disabled={disputePending}>
              {disputePending ? 'Disputing…' : 'Raise Dispute'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile sidebar stack */}
      <style>{`
        @media (max-width: 760px) {
          .task-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
