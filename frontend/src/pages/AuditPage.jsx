import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import Skeleton from '../components/Skeleton'

const AC = {
  SCAN: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: '⟳', label: 'Scan' },
  SCAN_COMPLETED: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: '⟳', label: 'Scan' },
  SIMULATE_REMEDIATION: { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', icon: '⚡', label: 'Remediation' },
  REPORT_GENERATED: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', icon: '↓', label: 'Report' },
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]); const [ld, setLd] = useState(true)
  const [filter, setFilter] = useState('ALL'); const [limit, setLimit] = useState(50)

  useEffect(() => {
    setLd(true)
    const p = new URLSearchParams({ limit }); if (filter !== 'ALL') p.set('action_type', filter)
    api.get(`/audit-log?${p}`).then(r => setLogs(r.data ?? [])).catch(console.error).finally(() => setLd(false))
  }, [filter, limit])

  return (
    <div className="page space-y-4">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>Audit Trail</h1>
          <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>Immutable compliance log · {logs.length} events</p>
        </div>
        <span className="status-badge status-active">● TAMPER-PROOF</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div className="tab-strip">
          {['ALL', 'SCAN', 'SIMULATE_REMEDIATION', 'REPORT_GENERATED'].map(f => (
            <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f === 'SIMULATE_REMEDIATION' ? 'REMEDIATION' : f}</button>
          ))}
        </div>
        <select value={limit} onChange={e => setLimit(+e.target.value)} className="input select" style={{ width: 'auto' }}>
          <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {ld ? <div>{[...Array(6)].map((_, i) => <Skeleton key={i} height={64} radius={0} style={{ borderBottom: '1px solid #1C2840' }} />)}</div>
          : logs.length === 0 ? <div className="empty-state"><div className="icon">📋</div><h3>No Events</h3><p>Run a scan</p></div>
            : logs.map((log, i) => {
              const ac = AC[log.action_type] || { color: '#6B7B94', bg: 'rgba(107,123,148,0.1)', icon: '·', label: log.action_type }
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 22px', borderBottom: i === logs.length - 1 ? 'none' : '1px solid rgba(28,40,64,0.5)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ac.bg, color: ac.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{ac.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, background: ac.bg, color: ac.color, fontSize: 11, fontWeight: 700 }}>{ac.label}</span>
                      <span style={{ fontSize: 12, color: '#6B7B94' }}>{log.user_id}</span>
                      {log.file_id && <span className="mono" style={{ fontSize: 11, color: '#3D4E66' }}>File #{log.file_id}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7B94' }}>
                      {(log.action_type === 'SCAN' || log.action_type === 'SCAN_COMPLETED') && log.details?.files_scanned !== undefined && <span>Scanned {log.details.files_scanned} files · {log.details.high_risk_files ?? 0} high-risk</span>}
                      {log.action_type === 'SIMULATE_REMEDIATION' && log.details?.file_path && <span>File: {log.details.file_path.split(/[/\\]/).pop()}</span>}
                      {log.action_type === 'REPORT_GENERATED' && <span>PDF compliance report exported</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 12, color: '#E8ECF4' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="mono" style={{ fontSize: 10, color: '#3D4E66' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              )
            })}
      </div>
    </div>
  )
}
