import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet'
import { parseUnits } from 'viem'
import {
  usePostTask,
  useApproveUSDC,
  useUSDCAllowance,
  useUSDCBalance,
} from '../hooks/useTaskRegistry'
import { TASK_CATEGORIES } from '../lib/contracts'

function TxStep({ number, label, status }) {
  const colors = { idle: '#6B7280', pending: '#F59E0B', done: '#10B981', error: '#EF4444' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: status === 'done' ? '#10B981' : status === 'pending' ? '#F59E0B' : '#1E2128',
        border: `1.5px solid ${colors[status]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: status === 'idle' ? '#6B7280' : 'white',
        flexShrink: 0,
      }}>
        {status === 'done' ? '✓' : number}
      </div>
      <span style={{ fontSize: 14, color: colors[status], fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function PostTask() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'code',
    bounty: '',
    deadline: '',
  })
  const [txStage, setTxStage] = useState('idle') // idle | approving | approved | posting | done

  const { data: balance } = useUSDCBalance(address)
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(address)

  const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess } = useApproveUSDC()
  const { postTask, isPending: postPending, isConfirming: postConfirming, isSuccess: postSuccess } = usePostTask()

  const bountyAmount = parseFloat(form.bounty) || 0
  const bountyWei = form.bounty ? parseUnits(form.bounty, 6) : BigInt(0)
  const hasEnoughAllowance = allowance && bountyWei > BigInt(0) && allowance >= bountyWei
  const balanceUSDC = balance ? (Number(balance) / 1e6).toFixed(2) : '—'

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance()
      setTxStage('approved')
    }
  }, [approveSuccess])

  useEffect(() => {
    if (postSuccess) {
      setTxStage('done')
      setTimeout(() => navigate('/tasks'), 2000)
    }
  }, [postSuccess])

  const handleApprove = () => {
    setTxStage('approving')
    approve(form.bounty)
  }

  const handlePost = () => {
    setTxStage('posting')
    postTask(form)
  }

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const isValid = form.title && form.description && form.category && bountyAmount >= 1 && form.deadline

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h2 style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Connect Wallet</h2>
        <p style={{ color: '#9CA3AF', fontSize: 15, marginBottom: 24 }}>Connect your wallet to post a task</p>
        <Wallet>
          <ConnectWallet />
          <WalletDropdown>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    )
  }

  if (txStage === 'done') {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)',
          border: '2px solid #10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          margin: '0 auto 20px',
        }}>✓</div>
        <h2 style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Task Posted!</h2>
        <p style={{ color: '#9CA3AF', fontSize: 15 }}>Your task is live on Base. Redirecting to board…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#F9FAFB', fontSize: 28, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 4 }}>
          Post a Task
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          USDC bounty is locked in escrow on Base until task is completed
        </p>
      </div>

      <div style={{
        background: '#111318',
        border: '1px solid #1E2128',
        borderRadius: 14,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* Title */}
        <div>
          <label style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Task Title <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            className="input-base"
            placeholder="e.g. Analyze 1000 wallet addresses for trading patterns"
            value={form.title}
            onChange={update('title')}
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Description <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            className="input-base"
            placeholder="Describe what the agent needs to do, expected output format, and any requirements…"
            value={form.description}
            onChange={update('description')}
            rows={5}
            style={{ resize: 'vertical', minHeight: 120 }}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Category <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select className="input-base" value={form.category} onChange={update('category')}>
            {TASK_CATEGORIES.map(c => (
              <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
            ))}
          </select>
        </div>

        {/* Bounty + Deadline row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Bounty (USDC) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-base"
                type="number"
                min="1"
                step="0.01"
                placeholder="10.00"
                value={form.bounty}
                onChange={update('bounty')}
                style={{ paddingRight: 60 }}
              />
              <span style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 600,
              }}>
                USDC
              </span>
            </div>
            <div style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
              Balance: {balanceUSDC} USDC
            </div>
          </div>

          <div>
            <label style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Deadline <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              className="input-base"
              type="datetime-local"
              value={form.deadline}
              onChange={update('deadline')}
              min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
            />
          </div>
        </div>

        {/* Fee note */}
        {bountyAmount > 0 && (
          <div style={{
            background: 'rgba(0,82,255,0.07)',
            border: '1px solid rgba(0,82,255,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
          }}>
            <span style={{ color: '#9CA3AF' }}>Agent receives</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>
              ${(bountyAmount * 0.98).toFixed(2)} USDC
            </span>
            <span style={{ color: '#9CA3AF' }}>2% protocol fee: ${(bountyAmount * 0.02).toFixed(2)}</span>
          </div>
        )}

        {/* TX Steps */}
        {txStage !== 'idle' && (
          <div style={{
            background: '#0A0B0D',
            border: '1px solid #1E2128',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <TxStep
              number="1"
              label="Approve USDC spending"
              status={txStage === 'approving' || approveConfirming ? 'pending' : txStage === 'approved' || txStage === 'posting' || txStage === 'done' ? 'done' : 'idle'}
            />
            <TxStep
              number="2"
              label="Post task onchain"
              status={txStage === 'posting' || postConfirming ? 'pending' : txStage === 'done' ? 'done' : 'idle'}
            />
          </div>
        )}

        {/* Action Button */}
        {!hasEnoughAllowance && txStage !== 'approved' ? (
          <button
            className="btn-primary"
            onClick={handleApprove}
            disabled={!isValid || approvePending || approveConfirming}
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
          >
            {approvePending ? 'Confirm in wallet…' : approveConfirming ? 'Approving…' : `Approve ${form.bounty || '0'} USDC`}
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handlePost}
            disabled={!isValid || postPending || postConfirming}
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
          >
            {postPending ? 'Confirm in wallet…' : postConfirming ? 'Posting onchain…' : 'Post Task on Base'}
          </button>
        )}
      </div>
    </div>
  )
}
