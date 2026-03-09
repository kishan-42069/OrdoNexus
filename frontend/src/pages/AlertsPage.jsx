import { useState, useEffect } from 'react'
import { api, fmtCrore, riskBadgeClass } from '../utils/api'
import Skeleton from '../components/Skeleton'

export default function AlertsPage({ toast }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sim, setSim] = useState(null)

  useEffect(() => { api.get('/alerts').then(r => setAlerts(r.data.alerts ?? [])).catch(console.error).finally(() => setLoading(false)) }, [])

  const rem = async (fid, fn) => {
    setSim(fid)
    try { const r = await api.post(`/simulate-remediation?file_id=${fid}`); toast?.(`Remediated ${fn} · saved ${fmtCrore(r.data.financial_liability_saved)}`, 'success'); setAlerts(a => a.filter(x => x.file_id !== fid)) }
    catch { toast?.('Failed', 'error') }
    setSim(null)
  }

  return (
    <div className="page space-y-4">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>Active Alerts</h1>
          <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>{alerts.length} compliance violations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {alerts.filter(a => a.severity === 'CRITICAL').length > 0 && <span className="badge badge-critical">{alerts.filter(a => a.severity === 'CRITICAL').length} CRITICAL</span>}
          {alerts.filter(a => a.severity === 'HIGH').length > 0 && <span className="badge badge-high">{alerts.filter(a => a.severity === 'HIGH').length} HIGH</span>}
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={90} />)}</div>
        : alerts.length === 0 ? <div className="card"><div className="empty-state"><div className="icon">✓</div><h3>All Clear</h3><p>No active alerts</p></div></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(a => (
              <div key={a.id} className="card fade-up" style={{ padding: '16px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span className={riskBadgeClass(a.severity)} style={{ marginTop: 3, flexShrink: 0 }}>{a.severity}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4', marginBottom: 6 }}>{a.message}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#6B7B94' }}>
                      <span className="mono">{a.file_name}</span><span>·</span><span>{a.bucket?.replace(/_/g, ' ')}</span>
                      <span>·</span><span>Risk <strong style={{ color: '#E8ECF4' }}>{a.risk_score?.toFixed(1)}</strong></span>
                      {a.financial_liability > 0 && <><span>·</span><span style={{ color: '#EF4444' }}>{fmtCrore(a.financial_liability)}</span></>}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" disabled={sim === a.file_id} onClick={() => rem(a.file_id, a.file_name)} style={{ flexShrink: 0 }}>{sim === a.file_id ? '…' : 'Remediate'}</button>
                </div>
              </div>
            ))}
          </div>}
      <div className="info-box"><strong>Note: </strong>Remediation simulations mark files as handled.</div>
    </div>
  )
}
