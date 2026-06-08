import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Avatar, Name, Address } from '@coinbase/onchainkit/identity'
import {
  useTask,
  useTaskBids,
  useBidOnTask,
  useAssignTask,
  useSubmitWork,
  useAttestCompletion,
  useCancelTask,
} from '../hooks/useTaskRegistry'
import { TASK_STATUS } from '../lib/contracts'

const STATUS_CLASS = {
  0: 'status-open',
  1: 'status-assigned',
  2: 'status-submitted',
  3: 'status-completed',
  4: 'status-disputed',
  5: 'status-cancelled',
}

function formatUSDC(n) { return (Number(n) / 1e6).toFixed(2) }
function formatDate(ts) { return new Date(Number(ts) * 1000).toLocaleString() }
function shortAddr(a) { return `${a?.slice(0, 8)}…${a?.slice(-6)}` }
function timeLeft(deadline) {
  const diff = Number(deadline) - Math.floor(Date.now() / 1000)
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600)
  return d > 0 ? `${d}d ${h}h left` : `${h}h left`
}

export default function TaskDetail() {
  const { id } = useParams()
  const { address } = useAccount()
  const { data: task, isLoading, refetch } = useTask(id)
  const { data: bids = [] } = useTaskBids(id)

  const [bidProposal, setBidProposal] = useState('')
  const [deliverableHash, setDeliverableHash] = useState('')
  const [rating, setRating] = useState(5)

  const { bid, isPending: bidPending, isConfirming: bidConfirming, isSuccess: bidSuccess } = useBidOnTask()
  const { assign, isPending: assignPending } = useAssignTask()
  const { submit, isPending: submitPending } = useSubmitWork()
  const { attest, isPending: attestPending } = useAttestCompletion()
  const { cancel, isPending: cancelPending } = useCancelTask()

  if (isLoading) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px' }}>
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    )
  }

  if (!task || task.id === BigInt(0)) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ color: '#F9FAFB', marginBottom: 8 }}>Task not found</h2>
        <Link to="/tasks" style={{ color: '#0052FF' }}>← Back to board</Link>
      </div>
    )
  }

  const isPoster = address?.toLowerCase() === task.poster?.toLowerCase()
  const isAssignedAgent = address?.toLowerCase() === task.assignedAgent?.toLowerCase()
  const status = Number(task.status)
  const hasBid = bids.some(b => b.agent?.toLowerCase() === address?.toLowerCase())

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Back */}
      <Link to="/tasks" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        ← Back to Board
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Task Header */}
          <div style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 14,
            padding: 28,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                background: '#1E2128', color: '#9CA3AF', padding: '3px 10px', borderRadius: 20,
              }}>
                {task.category}
              </span>
              <span className={STATUS_CLASS[status]} style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '3px 10px', borderRadius: 20,
              }}>
                {TASK_STATUS[status]}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: 'rgba(0,82,255,0.1)', color: '#60A5FA',
                border: '1px solid rgba(0,82,255,0.2)',
                padding: '3px 10px', borderRadius: 20,
              }}>
                Task #{id}
              </span>
            </div>

            <h1 style={{ color: '#F9FAFB', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 16 }}>
              {task.title}
            </h1>

            <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
              {task.description}
            </p>

            {task.deliverableHash && (
              <div style={{
                background: '#0A0B0D',
                border: '1px solid #1E2128',
                borderRadius: 8,
                padding: '12px 16px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: '#60A5FA',
                wordBreak: 'break-all',
              }}>
                📦 Deliverable: {task.deliverableHash}
              </div>
            )}
          </div>

          {/* Bids Section */}
          <div style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 14,
            padding: 24,
          }}>
            <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 18 }}>
              Bids ({bids.length})
            </h2>

            {bids.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: 14 }}>No bids yet. Be the first agent to bid.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bids.map((b, i) => (
                  <div key={i} style={{
                    background: '#0A0B0D',
                    border: `1px solid ${b.selected ? '#10B981' : '#1E2128'}`,
                    borderRadius: 10,
                    padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to={`/agent/${b.agent}`} style={{ color: '#0052FF', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textDecoration: 'none' }}>
                          {shortAddr(b.agent)}
                        </Link>
                        {b.selected && (
                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#6B7280', fontSize: 12 }}>
                        {new Date(Number(b.bidAt) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.5 }}>{b.proposal}</p>

                    {isPoster && status === 0 && !b.selected && (
                      <button
                        className="btn-secondary"
                        style={{ marginTop: 12, padding: '7px 16px', fontSize: 13 }}
                        onClick={() => assign({ taskId: id, bidIndex: i })}
                        disabled={assignPending}
                      >
                        {assignPending ? 'Assigning…' : 'Assign this Agent'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Bid */}
            {status === 0 && !isPoster && !hasBid && (
              <div style={{ marginTop: 20, borderTop: '1px solid #1E2128', paddingTop: 20 }}>
                <h3 style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Submit Your Bid</h3>
                <textarea
                  className="input-base"
                  placeholder="Describe your approach, timeline, and relevant experience…"
                  value={bidProposal}
                  onChange={e => setBidProposal(e.target.value)}
                  rows={4}
                  style={{ marginBottom: 10, resize: 'vertical' }}
                />
                <button
                  className="btn-primary"
                  onClick={() => bid({ taskId: id, proposal: bidProposal })}
                  disabled={!bidProposal.trim() || bidPending || bidConfirming}
                >
                  {bidPending ? 'Confirm in wallet…' : bidConfirming ? 'Submitting…' : 'Submit Bid'}
                </button>
              </div>
            )}
          </div>

          {/* Agent: Submit Work */}
          {isAssignedAgent && status === 1 && (
            <div style={{
              background: '#111318',
              border: '1px solid rgba(0,82,255,0.3)',
              borderRadius: 14,
              padding: 24,
            }}>
              <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Submit Deliverable</h2>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Upload your work to IPFS and paste the hash below.</p>
              <input
                className="input-base"
                placeholder="ipfs://Qm… or bafybe…"
                value={deliverableHash}
                onChange={e => setDeliverableHash(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <button
                className="btn-primary"
                onClick={() => submit({ taskId: id, deliverableHash })}
                disabled={!deliverableHash.trim() || submitPending}
              >
                {submitPending ? 'Submitting…' : 'Submit Work Onchain'}
              </button>
            </div>
          )}

          {/* Poster: Attest Completion */}
          {isPoster && status === 2 && (
            <div style={{
              background: '#111318',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 14,
              padding: 24,
            }}>
              <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Review & Release Payment</h2>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
                Review the deliverable above. Attesting releases <strong style={{ color: '#10B981' }}>${(Number(task.bounty) * 0.98 / 1e6).toFixed(2)} USDC</strong> to the agent.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#9CA3AF', fontSize: 13, display: 'block', marginBottom: 8 }}>Rate the agent (1–5)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      style={{
                        width: 40, height: 40, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 16,
                        border: `1.5px solid ${rating >= n ? '#F59E0B' : '#1E2128'}`,
                        background: rating >= n ? 'rgba(245,158,11,0.15)' : '#0A0B0D',
                        color: rating >= n ? '#F59E0B' : '#6B7280',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ background: '#10B981' }}
                onClick={() => attest({ taskId: id, rating })}
                disabled={attestPending}
              >
                {attestPending ? 'Releasing…' : `Release Payment (${rating}★)`}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Bounty card */}
          <div style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bounty</div>
            <div style={{ color: '#10B981', fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
              ${formatUSDC(task.bounty)}
            </div>
            <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>USDC · Escrowed</div>
          </div>

          {/* Details */}
          <div style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {[
              { label: 'Deadline', value: timeLeft(task.deadline) },
              { label: 'Posted', value: formatDate(task.createdAt) },
              { label: 'Bids', value: bids.length },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280', fontSize: 13 }}>{row.label}</span>
                <span style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Poster */}
          <div style={{
            background: '#111318',
            border: '1px solid #1E2128',
            borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Posted by</div>
            <Link to={`/agent/${task.poster}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1E2128', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 14 }}>◈</div>
              <span style={{ color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                {shortAddr(task.poster)}
              </span>
            </Link>
          </div>

          {/* Cancel */}
          {isPoster && status === 0 && (
            <button
              className="btn-secondary"
              onClick={() => cancel(id)}
              disabled={cancelPending}
              style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              {cancelPending ? 'Cancelling…' : 'Cancel & Refund'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
