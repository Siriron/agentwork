// ── PostTask ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, TASK_REGISTRY_ABI, ERC20_ABI, TASK_CATEGORIES } from './contracts'

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
      <label className={`label ${required?'label-required':''}`}>{label}</label>
      {children}
      {hint && <span style={{ fontSize:11,color:'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

export function PostTask() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [form, setForm] = useState({ title:'',description:'',category:'code',bounty:'',deadline:'' })
  const [stage, setStage] = useState('idle')

  const { data: balance } = useReadContract({ address:CONTRACTS.USDC,abi:ERC20_ABI,functionName:'balanceOf',args:[address],query:{enabled:!!address} })
  const { data: allowance, refetch: refetchAllow } = useReadContract({ address:CONTRACTS.USDC,abi:ERC20_ABI,functionName:'allowance',args:[address,CONTRACTS.TASK_REGISTRY],query:{enabled:!!address} })

  const { writeContract: writeApprove, data: approveHash, isPending: approvePending } = useWriteContract()
  const { isLoading: approveConfirm, isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: writePost, data: postHash, isPending: postPending } = useWriteContract()
  const { isLoading: postConfirm, isSuccess: postOk } = useWaitForTransactionReceipt({ hash: postHash })

  const bounty        = parseFloat(form.bounty) || 0
  const bountyWei     = form.bounty ? parseUnits(String(form.bounty), 6) : BigInt(0)
  const hasAllowance  = allowance && bountyWei > BigInt(0) && allowance >= bountyWei
  const isValid       = form.title.trim() && form.description.trim() && bounty >= 1 && form.deadline
  const balFmt        = balance ? (Number(balance)/1e6).toFixed(2) : '—'

  useEffect(() => { if (approveOk) { refetchAllow(); setStage('approved') } }, [approveOk])
  useEffect(() => { if (postOk) { setStage('done'); setTimeout(() => navigate('/tasks'), 1800) } }, [postOk])

  const upd = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const doApprove = () => {
    setStage('approving')
    writeApprove({ address:CONTRACTS.USDC, abi:ERC20_ABI, functionName:'approve', args:[CONTRACTS.TASK_REGISTRY, parseUnits(String(form.bounty), 6)] })
  }
  const doPost = () => {
    setStage('posting')
    writePost({ address:CONTRACTS.TASK_REGISTRY, abi:TASK_REGISTRY_ABI, functionName:'postTask',
      args:[form.title, form.description, form.category, parseUnits(String(form.bounty), 6), BigInt(Math.floor(new Date(form.deadline).getTime()/1000))] })
  }

  if (!isConnected) return (
    <div className="container" style={{ paddingTop:60,maxWidth:500,textAlign:'center' }}>
      <h2 style={{ fontSize:20,fontWeight:700,color:'var(--text)',marginBottom:8,letterSpacing:'-0.03em' }}>Connect your wallet</h2>
      <p style={{ color:'var(--text-3)',fontSize:13 }}>You need a wallet to post a task and lock the USDC bounty.</p>
    </div>
  )

  if (stage === 'done') return (
    <div className="container" style={{ paddingTop:80,maxWidth:500,textAlign:'center' }}>
      <div style={{ width:48,height:48,borderRadius:'50%',background:'var(--green-dim)',border:'1px solid var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,margin:'0 auto 16px' }}>✓</div>
      <h2 style={{ fontSize:20,fontWeight:700,color:'var(--text)',marginBottom:6,letterSpacing:'-0.03em' }}>Task posted</h2>
      <p style={{ color:'var(--text-3)',fontSize:13 }}>Redirecting to task board…</p>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop:28,paddingBottom:80,maxWidth:640 }}>
      <Link to="/tasks" style={{ fontSize:13,color:'var(--text-3)',textDecoration:'none',display:'inline-block',marginBottom:24 }}>← Back</Link>
      <h1 style={{ fontSize:22,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:4 }}>Post a task</h1>
      <p style={{ fontSize:13,color:'var(--text-3)',marginBottom:28 }}>USDC bounty locks in escrow until the task is completed</p>

      <div className="card" style={{ display:'flex',flexDirection:'column',gap:18 }}>
        <Field label="Title" required hint="Keep it specific and clear">
          <input className="input" placeholder="e.g. Analyze 500 wallet addresses for trading patterns" value={form.title} onChange={upd('title')} maxLength={120}/>
        </Field>

        <Field label="Description" required hint="What needs to be done, expected output, any requirements">
          <textarea className="input" placeholder="Describe the task in detail…" value={form.description} onChange={upd('description')} rows={5} style={{ resize:'vertical',minHeight:110 }}/>
        </Field>

        <Field label="Category" required>
          <select className="input" value={form.category} onChange={upd('category')}>
            {TASK_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c}</option>)}
          </select>
        </Field>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
          <Field label="Bounty (USDC)" required hint={`Your balance: ${balFmt} USDC`}>
            <div style={{ position:'relative' }}>
              <input className="input" type="number" min="1" step="0.01" placeholder="10.00" value={form.bounty} onChange={upd('bounty')} style={{ paddingRight:52 }}/>
              <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'var(--text-3)',fontWeight:500 }}>USDC</span>
            </div>
          </Field>
          <Field label="Deadline" required>
            <input className="input" type="datetime-local" value={form.deadline} onChange={upd('deadline')} min={new Date(Date.now()+3600000).toISOString().slice(0,16)}/>
          </Field>
        </div>

        {bounty >= 1 && (
          <div style={{ display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'var(--bg-3)',borderRadius:8,border:'1px solid var(--border)',fontSize:12 }}>
            <span style={{ color:'var(--text-3)' }}>Agent receives</span>
            <span style={{ fontWeight:600,color:'var(--text)' }}>${(bounty*0.98).toFixed(2)} USDC</span>
            <span style={{ color:'var(--text-3)' }}>2% fee: ${(bounty*0.02).toFixed(2)}</span>
          </div>
        )}

        {stage !== 'idle' && (
          <div style={{ display:'flex',flexDirection:'column',gap:8,padding:'12px 14px',background:'var(--bg-3)',borderRadius:8,border:'1px solid var(--border)' }}>
            {[
              { n:'1', label:'Approve USDC', done:stage==='approved'||stage==='posting'||stage==='done', active:stage==='approving' },
              { n:'2', label:'Post task onchain', done:stage==='done', active:stage==='posting' },
            ].map(s => (
              <div key={s.n} style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:20,height:20,borderRadius:'50%',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center', background:s.done?'var(--green)':s.active?'var(--text)':'var(--bg-2)', color:s.done||s.active?'var(--bg)':'var(--text-3)', border:`1px solid ${s.done?'var(--green)':s.active?'var(--text)':'var(--border)'}` }}>
                  {s.done ? '✓' : s.n}
                </div>
                <span style={{ fontSize:12,color:s.done?'var(--green)':s.active?'var(--text)':'var(--text-3)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {!hasAllowance && stage !== 'approved' ? (
          <button className="btn btn-primary btn-full" style={{ padding:'11px' }} onClick={doApprove} disabled={!isValid||approvePending||approveConfirm}>
            {approvePending ? 'Confirm in wallet…' : approveConfirm ? 'Approving…' : `Approve ${bounty||0} USDC`}
          </button>
        ) : (
          <button className="btn btn-primary btn-full" style={{ padding:'11px' }} onClick={doPost} disabled={!isValid||postPending||postConfirm}>
            {postPending ? 'Confirm in wallet…' : postConfirm ? 'Posting…' : 'Post task'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const { data: posterIds=[] } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getPosterTasks',args:[address],query:{enabled:!!address} })
  const { data: agentStats } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getAgentStats',args:[address],query:{enabled:!!address} })
  const { data: usdcBal } = useReadContract({ address:CONTRACTS.USDC,abi:ERC20_ABI,functionName:'balanceOf',args:[address],query:{enabled:!!address} })

  const completed  = agentStats ? Number(agentStats[0]) : 0
  const reputation = agentStats ? Number(agentStats[1]) : 0
  const balance    = usdcBal ? (Number(usdcBal)/1e6).toFixed(2) : '—'

  if (!isConnected) return (
    <div className="container" style={{ paddingTop:60,maxWidth:500,textAlign:'center' }}>
      <h2 style={{ fontSize:20,fontWeight:700,color:'var(--text)',marginBottom:8,letterSpacing:'-0.03em' }}>Dashboard</h2>
      <p style={{ color:'var(--text-3)',fontSize:13 }}>Connect your wallet to view your tasks and stats.</p>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop:28,paddingBottom:80 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:3 }}>Dashboard</h1>
        <p className="mono" style={{ fontSize:12,color:'var(--text-3)' }}>{address?.slice(0,10)}…{address?.slice(-8)}</p>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:24 }}>
        {[
          { label:'USDC Balance', value:`$${balance}` },
          { label:'Tasks Posted', value:posterIds.length },
          { label:'Completed',    value:completed },
          { label:'Reputation',   value:reputation },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:'center',padding:'14px 10px' }}>
            <div style={{ fontSize:20,fontWeight:700,color:'var(--text)',letterSpacing:'-0.04em',marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <div style={{ fontSize:12,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em' }}>Posted Tasks ({posterIds.length})</div>
          <Link to="/post" className="btn btn-primary btn-sm">+ New</Link>
        </div>

        {posterIds.length === 0 ? (
          <div style={{ textAlign:'center',padding:'24px 0' }}>
            <p style={{ color:'var(--text-3)',fontSize:13,marginBottom:14 }}>No tasks posted yet</p>
            <Link to="/post" className="btn btn-secondary btn-sm">Post your first task</Link>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column' }}>
            {[...posterIds].reverse().map(id => <DashTaskRow key={id.toString()} id={id.toString()}/>)}
          </div>
        )}
      </div>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:12,flexWrap:'wrap',gap:12,marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:600,fontSize:13,color:'var(--text)',marginBottom:2 }}>Agent profile</div>
          <div style={{ fontSize:12,color:'var(--text-3)' }}>View your reputation score and full task history</div>
        </div>
        <Link to={`/agent/${address}`} className="btn btn-secondary btn-sm">View →</Link>
      </div>

      <div className="card">
        <div style={{ fontSize:12,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14 }}>Deployed Contracts</div>
        {[
          { label:'TaskRegistry',     addr:'0xf7fe183835fc49089ead3ba36da24dda47e79618', tx:'https://basescan.org/tx/0xa9953c58fb5ed7b6a83d038075a0612594377a51ae50910e5d7571c44ab9833d' },
          { label:'ReputationOracle', addr:'0xddaed112351aecd7968056e2089079a4e8dc37ce', tx:'https://basescan.org/tx/0x694c34dbf85f02b8218ecd00d924c546819bd3abd99db07d63f50655ba37a695' },
        ].map((c,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:i===0?'1px solid var(--border)':'none',gap:12,flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2 }}>{c.label}</div>
              <div className="mono" style={{ fontSize:11,color:'var(--text-3)' }}>{c.addr.slice(0,10)}…{c.addr.slice(-8)}</div>
            </div>
            <div style={{ display:'flex',gap:6 }}>
              <a href={`https://basescan.org/address/${c.addr}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize:11 }}>Contract ↗</a>
              <a href={c.tx} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize:11 }}>Deploy TX ↗</a>
            </div>
          </div>
        ))}
      </div>

      <style>{`@media(max-width:640px){.dash-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  )
}

function DashTaskRow({ id }) {
  const STATUS_BADGE  = { 0:'badge-open',1:'badge-assigned',2:'badge-submitted',3:'badge-completed',4:'badge-disputed',5:'badge-cancelled' }
  const STATUS_LABEL  = { 0:'Open',1:'Assigned',2:'Submitted',3:'Completed',4:'Disputed',5:'Cancelled' }
  const { data: core } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getTaskCore',args:[BigInt(id)] })
  const { data: meta } = useReadContract({ address:CONTRACTS.TASK_REGISTRY,abi:TASK_REGISTRY_ABI,functionName:'getTaskMeta',args:[BigInt(id)] })
  if (!core||!meta) return <div className="skeleton" style={{ height:44,borderRadius:6,marginBottom:1 }}/>
  const status = Number(core.status)
  return (
    <Link to={`/tasks/${id}`} style={{ textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--border)',gap:12,cursor:'pointer' }}
      onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
      <div style={{ display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0 }}>
        <span className="mono" style={{ fontSize:11,color:'var(--text-3)',flexShrink:0 }}>#{id}</span>
        <span style={{ fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{meta.title}</span>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
        <span style={{ fontSize:13,fontWeight:600,color:'var(--text)' }}>${(Number(core.bounty)/1e6).toFixed(2)}</span>
        <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
      </div>
    </Link>
  )
}
