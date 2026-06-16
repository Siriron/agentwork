import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Avatar, Name, Address, Badge, Identity } from '@coinbase/onchainkit/identity'
import { base } from 'wagmi/chains'
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage } from '@coinbase/onchainkit/swap'
import { FundButton } from '@coinbase/onchainkit/fund'
import { TASK_REGISTRY_ABI, ERC20_ABI, TASK_CATEGORIES, ETH_TOKEN } from './contracts'
import { useNetwork } from './NetworkContext'
import { useToast } from './Toast'

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label className={`label ${required?'label-required':''}`}>{label}</label>
      {children}
      {hint && <span style={{ fontSize:11, color:'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

// ── Deploy TX links ────────────────────────────────────────────────────────────
const DEPLOY_TXS = {
  mainnet: {
    TASK_REGISTRY:     'https://basescan.org/tx/0xd6944ab28ecd78df515d6a6ff5e1a3a618080e77cda9372956ef451603daa568',
    REPUTATION_ORACLE: 'https://basescan.org/tx/0x5422bd8dd458f568c295bb533fea36b1709fd785561a0c59491d08addf2881c7',
  },
  testnet: {
    TASK_REGISTRY:     'https://sepolia.basescan.org/tx/0x2fee96735da0becd1875970323b3129e39f2acace8b9049bb0d751ac32f0407a',
    REPUTATION_ORACLE: 'https://sepolia.basescan.org/tx/0xcb8dd4830a08457b9e02db5d61a2bafff78cd5ca0de90ac18164de77acba1a7f',
  },
}

// ── PostTask ──────────────────────────────────────────────────────────────────
export function PostTask() {
  const navigate   = useNavigate()
  const { address, isConnected } = useAccount()
  const { CONTRACTS, TOKENS, formatAmount, isTestnet } = useNetwork()
  const toast = useToast()

  // Form state
  const [form, setForm] = useState({
    title:'', description:'', category:'code',
    token:'', bounty:'', deadline:'',
  })
  const [showSwap, setShowSwap] = useState(false)

  // Transaction stage machine
  // idle → approving → waitApprove → approved → posting → waitPost → done | error
  const [stage,  setStage]  = useState('idle')
  const [errMsg, setErrMsg] = useState('')

  // Store approved amount locally to avoid stale allowance read race
  const approvedRef = useRef(BigInt(0))

  // Set default token once TOKENS loads
  useEffect(() => {
    if (TOKENS.length > 0 && !form.token) {
      setForm(f => ({ ...f, token: TOKENS[1]?.address || TOKENS[0].address }))
    }
  }, [TOKENS])

  // Reset stage when token changes
  const handleTokenChange = e => {
    setForm(f => ({ ...f, token: e.target.value }))
    setStage('idle')
    setErrMsg('')
    approvedRef.current = BigInt(0)
  }

  const selectedToken = TOKENS.find(t => t.address === form.token) || TOKENS[0] || { symbol:'', decimals:6, minBounty:0, icon:'' }
  const isETH         = form.token === ETH_TOKEN
  const bountyNum     = parseFloat(form.bounty) || 0
  const bountyWei     = form.bounty && selectedToken?.decimals != null
    ? parseUnits(String(parseFloat(form.bounty).toFixed(selectedToken.decimals)), selectedToken.decimals)
    : BigInt(0)

  const upd     = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const isValid = form.title.trim().length > 0
    && form.description.trim().length > 0
    && bountyNum >= (selectedToken?.minBounty || 0)
    && form.deadline

  // ETH balance
  const { data: ethBalance } = useBalance({
    address, query: { enabled: !!address && isETH },
  })

  // ERC-20 balance + allowance
  const { data: tokenBal } = useReadContract({
    address: isETH ? undefined : form.token,
    abi: ERC20_ABI, functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && !isETH && !!form.token },
  })
  const { data: allowance, refetch: refetchAllow } = useReadContract({
    address: isETH ? undefined : form.token,
    abi: ERC20_ABI, functionName: 'allowance',
    args: [address, CONTRACTS.TASK_REGISTRY],
    query: { enabled: !!address && !isETH && !!form.token },
  })

  // Approve write
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveErr,
    reset: resetApprove,
  } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // Post write
  const {
    writeContract: writePost,
    data: postHash,
    isPending: postPending,
    error: postErr,
    reset: resetPost,
  } = useWriteContract()
  const { isLoading: postConfirming, isSuccess: postConfirmed } =
    useWaitForTransactionReceipt({ hash: postHash })

  // Stage transitions from hash appearance
  useEffect(() => { if (approveHash && stage === 'approving') setStage('waitApprove') }, [approveHash])
  useEffect(() => { if (postHash    && stage === 'posting')   setStage('waitPost')    }, [postHash])

  // Approve confirmed → update ref, refetch, advance
  useEffect(() => {
    if (!approveConfirmed || stage !== 'waitApprove') return
    approvedRef.current = bountyWei
    refetchAllow().finally(() => {
      setStage('approved')
      toast('Approved — now post your task', 'success')
    })
  }, [approveConfirmed])

  // Post confirmed → done
  useEffect(() => {
    if (!postConfirmed || stage !== 'waitPost') return
    setStage('done')
    toast('Task posted successfully!', 'success')
    setTimeout(() => navigate('/tasks'), 1800)
  }, [postConfirmed])

  // Wallet errors
  useEffect(() => {
    if (!approveErr) return
    setErrMsg(approveErr.shortMessage || approveErr.message || 'Approve failed')
    setStage('error')
  }, [approveErr])
  useEffect(() => {
    if (!postErr) return
    setErrMsg(postErr.shortMessage || postErr.message || 'Post failed')
    setStage('error')
  }, [postErr])

  // Allowance check — use ref after approval to avoid stale read
  const effectiveAllowance = ['approved','posting','waitPost','done'].includes(stage)
    ? approvedRef.current
    : (allowance ?? BigInt(0))
  const hasAllowance = isETH || (bountyWei > BigInt(0) && effectiveAllowance >= bountyWei)
  const showPostBtn  = hasAllowance || ['approved','posting','waitPost','done'].includes(stage)

  const doApprove = () => {
    resetApprove()
    setStage('approving')
    setErrMsg('')
    writeApprove({
      address: form.token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.TASK_REGISTRY, bountyWei],
    })
  }

  const doPost = () => {
    resetPost()
    setStage('posting')
    setErrMsg('')
    const deadline = BigInt(Math.floor(new Date(form.deadline).getTime() / 1000))
    if (isETH) {
      writePost({
        address: CONTRACTS.TASK_REGISTRY,
        abi: TASK_REGISTRY_ABI,
        functionName: 'postTaskETH',
        args: [form.title, form.description, form.category, deadline],
        value: bountyWei,
        gas: 500_000n,
      })
    } else {
      writePost({
        address: CONTRACTS.TASK_REGISTRY,
        abi: TASK_REGISTRY_ABI,
        functionName: 'postTask',
        args: [form.title, form.description, form.category, form.token, bountyWei, deadline],
        gas: 500_000n,
      })
    }
  }

  // Balance display
  const balDisplay = () => {
    if (isETH) return ethBalance ? `${Number(formatUnits(ethBalance.value, 18)).toFixed(4)} ETH` : '—'
    if (!tokenBal) return '—'
    return `${formatAmount(tokenBal, form.token)} ${selectedToken.symbol}`
  }

  const fee    = bountyNum * 0.02
  const payout = bountyNum * 0.98
  const decimals = selectedToken?.decimals === 18 ? 5 : 2

  // ── Redirect states ──
  if (!isConnected) return (
    <div className="container" style={{ paddingTop:80, maxWidth:480, textAlign:'center', paddingBottom:80 }}>
      <div style={{ fontSize:32, marginBottom:16 }}>🔐</div>
      <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Connect your wallet</h2>
      <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:24, lineHeight:1.7 }}>
        You need a wallet to post a task and lock the bounty in escrow.
      </p>
      <FundButton/>
    </div>
  )

  if (stage === 'done') return (
    <div className="container" style={{ paddingTop:80, maxWidth:480, textAlign:'center', paddingBottom:80 }}>
      <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--green-dim)', border:'1px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 20px' }}>✓</div>
      <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Task posted!</h2>
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Redirecting to task board…</p>
    </div>
  )

  // ── Form ──
  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80, maxWidth:660 }}>
      <Link to="/tasks" style={{ fontSize:13, color:'var(--text-3)', textDecoration:'none', display:'inline-block', marginBottom:24 }}>
        ← Back
      </Link>

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.03em', marginBottom:4 }}>Post a task</h1>
        <p style={{ fontSize:13, color:'var(--text-3)' }}>Bounty locks in escrow · Released on your approval · 2% protocol fee</p>
      </div>

      <div className="card" style={{ display:'flex', flexDirection:'column', gap:20 }}>

        <Field label="Title" required hint="Be specific — what exactly needs to be done?">
          <input className="input"
            placeholder="e.g. Analyze 500 wallet addresses for trading patterns"
            value={form.title} onChange={upd('title')} maxLength={120}/>
        </Field>

        <Field label="Description" required hint="Expected output, requirements, any context agents need">
          <textarea className="input"
            placeholder="Describe the task in detail…"
            value={form.description} onChange={upd('description')}
            rows={5} style={{ resize:'vertical', minHeight:110 }}/>
        </Field>

        <Field label="Category" required>
          <select className="input" value={form.category} onChange={upd('category')}>
            {TASK_CATEGORIES.map(c => (
              <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c}</option>
            ))}
          </select>
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }} className="post-grid">
          <Field label="Payment token" required>
            <select className="input" value={form.token} onChange={handleTokenChange}>
              {TOKENS.map(t => (
                <option key={t.address} value={t.address}>{t.icon} {t.symbol} — {t.name}</option>
              ))}
            </select>
          </Field>

          <Field label={`Bounty (${selectedToken.symbol})`} required
            hint={`Min ${selectedToken.minBounty} ${selectedToken.symbol} · Balance: ${balDisplay()}`}>
            <div style={{ position:'relative' }}>
              <input className="input" type="number"
                min={selectedToken.minBounty} step="any"
                placeholder={String(selectedToken.minBounty * 10)}
                value={form.bounty} onChange={upd('bounty')}
                style={{ paddingRight:54 }}/>
              <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--text-3)', fontWeight:600, pointerEvents:'none' }}>
                {selectedToken.symbol}
              </span>
            </div>
          </Field>
        </div>

        <Field label="Deadline" required>
          <input className="input" type="datetime-local"
            value={form.deadline} onChange={upd('deadline')}
            min={new Date(Date.now()+3600000).toISOString().slice(0,16)}/>
        </Field>

        {/* Inline swap */}
        {!isETH && (
          <div>
            <button className="btn btn-ghost btn-sm"
              onClick={() => setShowSwap(s => !s)}
              style={{ fontSize:12, color:'var(--text-3)', padding:'4px 0' }}>
              {showSwap ? '▾ Hide swap' : '▸ Swap to ' + selectedToken.symbol + ' inline'}
            </button>
            {showSwap && (
              <div style={{ marginTop:10, padding:16, background:'var(--bg-3)', borderRadius:10, border:'1px solid var(--border)' }}>
                <Swap>
                  <SwapAmountInput
                    label="From"
                    token={{ symbol:'ETH', name:'Ethereum', address:'', chainId:8453, decimals:18, image:null }}
                    type="from"/>
                  <SwapToggleButton/>
                  <SwapAmountInput
                    label="To"
                    token={{ symbol:selectedToken.symbol, name:selectedToken.name, address:selectedToken.address, chainId:8453, decimals:selectedToken.decimals, image:null }}
                    type="to"/>
                  <SwapButton/>
                  <SwapMessage/>
                </Swap>
              </div>
            )}
          </div>
        )}

        {/* Fee breakdown */}
        {bountyNum > 0 && bountyNum >= selectedToken.minBounty && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-3)', borderRadius:8, border:'1px solid var(--border)', fontSize:12, flexWrap:'wrap', gap:8 }}>
            <span style={{ color:'var(--text-3)' }}>Agent receives</span>
            <span style={{ fontWeight:600, color:'var(--text)' }}>{payout.toFixed(decimals)} {selectedToken.symbol}</span>
            <span style={{ color:'var(--text-3)' }}>Fee: {fee.toFixed(decimals)}</span>
          </div>
        )}

        {/* ETH single-tx note */}
        {isETH && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', background:'var(--green-dim)', border:'1px solid var(--green)', borderRadius:8, fontSize:12, color:'var(--green)' }}>
            ⚡ ETH bounty — no approval needed, single transaction
          </div>
        )}

        {/* Approve → Post steps */}
        {!isETH && !['idle','error'].includes(stage) && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 14px', background:'var(--bg-3)', borderRadius:8, border:'1px solid var(--border)' }}>
            {[
              { n:'1', label:`Approve ${selectedToken.symbol}`,  done:['approved','posting','waitPost','done'].includes(stage), active:['approving','waitApprove'].includes(stage) },
              { n:'2', label:'Post task onchain',                done:stage==='done', active:['posting','waitPost'].includes(stage) },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:20, height:20, borderRadius:'50%', fontSize:11, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  background: s.done ? 'var(--green)' : s.active ? 'var(--text)' : 'var(--bg-2)',
                  color:      s.done || s.active ? 'var(--bg)' : 'var(--text-3)',
                  border:    `1px solid ${s.done ? 'var(--green)' : s.active ? 'var(--text)' : 'var(--border)'}`,
                }}>
                  {s.done ? '✓' : s.n}
                </div>
                <span style={{ fontSize:12, color: s.done ? 'var(--green)' : s.active ? 'var(--text)' : 'var(--text-3)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {stage === 'error' && errMsg && (
          <div style={{ padding:'10px 14px', background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:8, fontSize:13, color:'var(--red)', lineHeight:1.6 }}>
            {errMsg}
          </div>
        )}

        {/* Action button — never ambiguous */}
        {showPostBtn ? (
          <button className="btn btn-primary btn-full" style={{ padding:'11px 0' }}
            onClick={doPost}
            disabled={!isValid || postPending || postConfirming || stage === 'waitPost'}>
            {postPending
              ? 'Confirm in wallet…'
              : (postConfirming || stage === 'waitPost')
              ? <><span className="spinner"/>&nbsp;Posting…</>
              : `Post task · ${bountyNum || 0} ${selectedToken.symbol}`}
          </button>
        ) : (
          <button className="btn btn-primary btn-full" style={{ padding:'11px 0' }}
            onClick={doApprove}
            disabled={!isValid || approvePending || approveConfirming || stage === 'waitApprove'}>
            {approvePending
              ? 'Confirm in wallet…'
              : (approveConfirming || stage === 'waitApprove')
              ? <><span className="spinner"/>&nbsp;Approving…</>
              : `Approve ${bountyNum || 0} ${selectedToken.symbol}`}
          </button>
        )}

        {/* Fund CTA for empty wallets */}
        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:11, color:'var(--text-3)' }}>No crypto? </span>
          <FundButton/>
        </div>
      </div>

      <style>{`
        @media(max-width:520px){
          .post-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── DashTaskRow ───────────────────────────────────────────────────────────────
function DashTaskRow({ id }) {
  const { CONTRACTS, tokenByAddress, formatAmount } = useNetwork()
  const STATUS_BADGE = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
  const STATUS_LABEL = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }

  const { data: core } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskCore', args: [BigInt(id)],
  })
  const { data: meta } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskMeta', args: [BigInt(id)],
  })

  if (!core || !meta) return (
    <div className="skeleton" style={{ height:44, borderRadius:6, marginBottom:4 }}/>
  )

  const token  = tokenByAddress(core.token)
  const status = Number(core.status)

  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid var(--border)', gap:12 }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
        <span className="mono" style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>#{id}</span>
        <span style={{ fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {meta.title}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
          {formatAmount(core.bounty, core.token)} {token?.symbol}
        </span>
        <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
      </div>
    </Link>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { address, isConnected } = useAccount()
  const { CONTRACTS, isTestnet } = useNetwork()

  const { data: posterIds   = [] } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getPosterTasks', args: [address],
    query: { enabled: !!address },
  })
  const { data: agentAssigned = [] } = useReadContract({
    address: CONTRACTS.TASK_REGISTRY, abi: TASK_REGISTRY_ABI,
    functionName: 'getAgentAssigned', args: [address],
    query: { enabled: !!address },
  })

  const scanBase  = isTestnet ? 'https://sepolia.basescan.org' : 'https://basescan.org'
  const deployTXs = isTestnet ? DEPLOY_TXS.testnet : DEPLOY_TXS.mainnet

  if (!isConnected) return (
    <div className="container" style={{ paddingTop:60, maxWidth:480, textAlign:'center', paddingBottom:80 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Dashboard</h2>
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Connect your wallet to view your activity.</p>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop:28, paddingBottom:80 }}>

      {/* Identity */}
      <div className="card" style={{ marginBottom:20 }}>
        <Identity address={address} chain={base} hasCopyAddressOnClick>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <Avatar style={{ width:48, height:48, borderRadius:'50%', flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:17, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis' }}><Name/></div>
              <div style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis' }}><Address/></div>
              <div style={{ marginTop:4 }}><Badge/></div>
            </div>
            <Link to={`/agent/${address}`} className="btn btn-secondary btn-sm" style={{ flexShrink:0 }}>
              View profile →
            </Link>
          </div>
        </Identity>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }} className="dash-stats">
        {[
          { label:'Tasks Posted',   value: posterIds.length },
          { label:'Tasks Assigned', value: agentAssigned.length },
          { label:'Network',        value: isTestnet ? 'Testnet' : 'Mainnet' },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:'center', padding:'14px 10px' }}>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.04em', marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Posted tasks */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Posted ({posterIds.length})
          </div>
          <Link to="/post" className="btn btn-primary btn-sm">+ New</Link>
        </div>
        {posterIds.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:12 }}>No tasks posted yet</p>
            <Link to="/post" className="btn btn-secondary btn-sm">Post your first task</Link>
          </div>
        ) : (
          <div>
            {[...posterIds].reverse().map(id => (
              <DashTaskRow key={id.toString()} id={id.toString()}/>
            ))}
          </div>
        )}
      </div>

      {/* Assigned tasks */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:16 }}>
          Assigned to me ({agentAssigned.length})
        </div>
        {agentAssigned.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:12 }}>No tasks assigned yet</p>
            <Link to="/tasks" className="btn btn-secondary btn-sm">Browse tasks to bid</Link>
          </div>
        ) : (
          <div>
            {[...agentAssigned].reverse().map(id => (
              <DashTaskRow key={id.toString()} id={id.toString()}/>
            ))}
          </div>
        )}
      </div>

      {/* Contracts */}
      <div className="card">
        <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>
          Deployed Contracts
        </div>
        {[
          { label:'TaskRegistry',     addr: CONTRACTS.TASK_REGISTRY },
          { label:'ReputationOracle', addr: CONTRACTS.REPUTATION_ORACLE },
        ].map((c,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom: i===0 ? '1px solid var(--border)' : 'none', gap:12, flexWrap:'wrap' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{c.label}</div>
              <div className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>
                {c.addr.slice(0,10)}…{c.addr.slice(-8)}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <a href={`${scanBase}/address/${c.addr}`} target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm" style={{ fontSize:11 }}>Contract ↗</a>
              <a href={c.label === 'TaskRegistry' ? deployTXs.TASK_REGISTRY : deployTXs.REPUTATION_ORACLE}
                target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm" style={{ fontSize:11 }}>Deploy TX ↗</a>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media(max-width:500px){
          .dash-stats{ grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
