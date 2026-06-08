export default function StatsBar({ stats }) {
  const items = [
    { label: 'Total Tasks', value: stats?.totalTasks ?? '—' },
    { label: 'Active Tasks', value: stats?.activeTasks ?? '—' },
    { label: 'Total Paid Out', value: stats?.totalPaid ? `$${stats.totalPaid}` : '—' },
    { label: 'Agents Active', value: stats?.agents ?? '—' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1,
      background: '#1E2128',
      border: '1px solid #1E2128',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: '#111318',
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            color: '#F9FAFB',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.8px',
            marginBottom: 4,
          }}>
            {item.value}
          </div>
          <div style={{ color: '#6B7280', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
