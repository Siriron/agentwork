import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { usePostTask, useApproveUSDC, useUSDCAllowance, useUSDCBalance } from '../hooks/useContracts'
import { TASK_CATEGORIES } from '../lib/contracts'
import { fmt } from '../lib/utils'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className={`label ${required ? 'label-required' : ''}`}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Step({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--bg-3)',
        color: done || active ? '#fff' : 'var(--text-3)',
        border: `1.5px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.2s',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--green)' : active ? 'var(--text)' : 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

export default function PostTask() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()

  const [form, setForm] = useState({ title: '', description: '', category: 'code', bounty: '', deadline: '' })
  const [stage, setStage] = useState('idle') // idle | approving | approved | posting | done

  const { data: balance } = useUSDCBalance(address)
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(address)
  const { approve, isPending: approvePending, isConfirming: approveConfirm, isSuccess: approveOk } = useApproveUSDC()
  const { postTask, isPending: postPending, isConfirming: postConfirm, isSuccess: postOk } = usePostTask()

  const bounty = parseFloat(form.bounty) || 0
  const bountyWei = form.bounty ? parseUnits(String(form.bounty), 6) : BigInt(0)
  const hasAllowance = allowance && bountyWei > BigInt(0) && allowance >= bountyWei
  const balanceUSDC = balance ? fmt.usdc(balance) : '—'
  const isValid = form.title.trim() && form.description.trim() && bounty >= 1 && form.deadline

  useEffect(() => { if (approveOk) { refetchAllowance(); setStage('approved') } }, [approveOk])
  useEffect(() => { if (postOk) { setStage('done'); setTimeout(() => navigate('/'), 1800) } }, [postOk])

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  if (!isConnected) return (
    <div className="container" style={{ paddingTop: 60, maxWidth: 480, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔌</div>
      <h2 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>Connect Wallet</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>You need a wallet to post a task and lock the USDC bounty.</p>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Click <strong>Connect</strong> in the top navigation.</p>
    </div>
  )

  if (stage === 'done') return (
    <div className="container" style={{ paddingTop: 80, maxWidth: 480, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>✓</div>
      <h2 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>Task Posted!</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Your task is live on Base. Redirecting…</p>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60, maxWidth: 680 }}>

      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ color: 'var(--text-3)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 12, letterSpacing: '-0.3px' }}>Post a Task</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 3 }}>USDC bounty is locked in escrow on Base until the task is completed</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <Field label="Task Title" required hint="Clear, specific title (max 120 chars)">
          <input className="input" placeholder="e.g. Analyze 500 wallet addresses for trading patterns" value={form.title} onChange={update('title')} maxLength={120} />
        </Field>

        <Field label="Description" required hint="What the agent needs to do, expected output format, any requirements">
          <textarea className="input" placeholder="Describe the task in detail…" value={form.description} onChange={update('description')} rows={5} style={{ resize: 'vertical', minHeight: 110 }} />
        </Field>

        <Field label="Category" required>
          <select className="input" value={form.category} onChange={update('category')}>
            {TASK_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Bounty (USDC)" required hint={`Balance: ${balanceUSDC} USDC`}>
            <div style={{ position: 'relative' }}>
              <input className="input" type="number" min="1" step="0.01" placeholder="10.00" value={form.bounty} onChange={update('bounty')} style={{ paddingRight: 56 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>USDC</span>
            </div>
          </Field>

          <Field label="Deadline" required>
            <input className="input" type="datetime-local" value={form.deadline} onChange={update('deadline')} min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} />
          </Field>
        </div>

        {/* Fee preview */}
        {bounty >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Agent receives</span>
            <span style={{ fontWeight: 600, color: 'var(--green)' }}>${(bounty * 0.98).toFixed(2)} USDC</span>
            <span style={{ color: 'var(--text-3)' }}>Protocol fee: ${(bounty * 0.02).toFixed(2)}</span>
          </div>
        )}

        {/* TX steps */}
        {stage !== 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <Step n="1" label="Approve USDC spending" active={stage === 'approving'} done={stage === 'approved' || stage === 'posting' || stage === 'done'} />
            <Step n="2" label="Post task onchain" active={stage === 'posting'} done={stage === 'done'} />
          </div>
        )}

        {/* Action */}
        {!hasAllowance && stage !== 'approved' ? (
          <button className="btn btn-primary btn-full btn-lg" onClick={() => { setStage('approving'); approve(form.bounty) }} disabled={!isValid || approvePending || approveConfirm}>
            {approvePending ? 'Confirm in wallet…' : approveConfirm ? 'Approving…' : `Approve ${bounty > 0 ? bounty : '0'} USDC`}
          </button>
        ) : (
          <button className="btn btn-primary btn-full btn-lg" onClick={() => { setStage('posting'); postTask(form) }} disabled={!isValid || postPending || postConfirm}>
            {postPending ? 'Confirm in wallet…' : postConfirm ? 'Posting onchain…' : 'Post Task on Base'}
          </button>
        )}
      </div>
    </div>
  )
}
