import { useState, useEffect } from 'react'
import { api, fmtDateTime, fmtNum } from '../utils/api'
import Skeleton from '../components/Skeleton'

const ST = {
    COMPLETED: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    RUNNING: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    FAILED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    CANCELLED: { color: '#6B7B94', bg: 'rgba(107,123,148,0.1)', border: '#1C2840' },
}

export default function ScanHistoryPage({ onScan, scanStatus }) {
    const [runs, setRuns] = useState([]); const [ld, setLd] = useState(true)
    const load = () => { setLd(true); api.get('/scan-history?limit=20').then(r => setRuns(r.data ?? [])).catch(console.error).finally(() => setLd(false)) }
    useEffect(() => { load() }, []); useEffect(() => { if (scanStatus === 'done') load() }, [scanStatus])
    const scanning = scanStatus === 'scanning'

    return (
        <div className="page space-y-4">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>Scan History</h1>
                    <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>Past executions · last 20 runs</p>
                </div>
                <button className="btn btn-primary" onClick={onScan} disabled={scanning}>{scanning ? 'Scanning…' : '▶ Run Scan'}</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {ld ? <div>{[...Array(5)].map((_, i) => <Skeleton key={i} height={56} radius={0} style={{ borderBottom: '1px solid #1C2840' }} />)}</div>
                    : runs.length === 0 ? <div className="empty-state"><div className="icon">◎</div><h3>No Scans</h3><p>Click "Run Scan"</p></div>
                        : <table className="tbl">
                            <thead><tr><th>ID</th><th>STARTED</th><th>STATUS</th><th>FILES</th><th>HIGH RISK</th><th>PII</th><th>DURATION</th></tr></thead>
                            <tbody>
                                {runs.map(r => {
                                    const s = ST[r.status] || ST.CANCELLED
                                    return (
                                        <tr key={r.id}>
                                            <td><span className="mono" style={{ fontSize: 12, color: '#6B7B94' }}>#{r.id}</span></td>
                                            <td><span className="mono" style={{ fontSize: 12 }}>{fmtDateTime(r.started_at)}</span></td>
                                            <td><span style={{ padding: '3px 12px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700 }}>{r.status}</span></td>
                                            <td><span className="mono" style={{ fontSize: 13 }}>{fmtNum(r.files_scanned ?? 0)}</span></td>
                                            <td><span className="mono font-700" style={{ color: r.high_risk_count > 0 ? '#EF4444' : '#3D4E66', fontSize: 13 }}>{r.high_risk_count ?? 0}</span></td>
                                            <td><span className="mono" style={{ fontSize: 13 }}>{fmtNum(r.total_pii_instances ?? 0)}</span></td>
                                            <td><span className="mono" style={{ fontSize: 12, color: '#6B7B94' }}>{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>}
            </div>

            {scanning && <div className="info-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4AA', boxShadow: '0 0 8px rgba(0,212,170,0.4)' }} className="pulse" />
                <strong>Scan in progress</strong> — page refreshes on completion.
            </div>}
        </div>
    )
}
