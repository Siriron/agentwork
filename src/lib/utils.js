export const fmt = {
  usdc: (n) => (Number(n) / 1e6).toFixed(2),
  addr: (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '',
  addrLong: (a) => a ? `${a.slice(0,10)}…${a.slice(-8)}` : '',
  date: (ts) => new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
  timeAgo: (ts) => {
    const s = Math.floor(Date.now()/1000) - Number(ts)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    if (s < 86400) return `${Math.floor(s/3600)}h ago`
    return `${Math.floor(s/86400)}d ago`
  },
  timeLeft: (deadline) => {
    const diff = Number(deadline) - Math.floor(Date.now()/1000)
    if (diff <= 0) return 'Expired'
    const d = Math.floor(diff/86400), h = Math.floor((diff%86400)/3600)
    if (d > 0) return `${d}d ${h}h left`
    if (h > 0) return `${h}h left`
    return `${Math.floor((diff%3600)/60)}m left`
  },
}

export const CATEGORY_COLORS = {
  'code':          '#7c3aed',
  'data-analysis': '#0052ff',
  'research':      '#059669',
  'content':       '#d97706',
  'design':        '#db2777',
  'moderation':    '#0891b2',
  'trading':       '#dc2626',
  'other':         '#71717a',
}

export const STATUS_BADGE = {
  0: 'badge-open',
  1: 'badge-assigned',
  2: 'badge-submitted',
  3: 'badge-completed',
  4: 'badge-disputed',
  5: 'badge-cancelled',
}

export const STATUS_LABEL = {
  0: 'Open', 1: 'Assigned', 2: 'Submitted',
  3: 'Completed', 4: 'Disputed', 5: 'Cancelled',
}
