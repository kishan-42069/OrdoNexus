import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, fmtCrore, fmtDate, riskBadgeClass } from '../utils/api'
import { SkeletonRows } from '../components/Skeleton'

const RISK_COLORS = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E' }
const BUCKETS = ['all', 'public_web', 'legacy_archive', 'finance_private']
const RISKS = ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function FilesPage({ toast }) {
  const [searchParams] = useSearchParams()
  const [files, setFiles] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState('all')
  const [risk, setRisk] = useState('all')
  const [sortBy, setSortBy] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [simulating, setSimulating] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir, page, page_size: PAGE_SIZE })
      if (bucket !== 'all') p.set('bucket', bucket)
      if (risk !== 'all') p.set('risk_level', risk)
      if (search.trim()) p.set('search', search.trim())
      const r = await api.get(`/files?${p}`)
      setFiles(r.data.files ?? []); setTotal(r.data.total ?? 0)
    } catch { toast?.('Failed to load files', 'error') }
    finally { setLoading(false) }
  }, [bucket, risk, sortBy, sortDir, page, search])
  useEffect(() => { load() }, [load])

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }; setPage(1)
  }
  const simulate = async (fid, fname) => {
    setSimulating(fid)
    try {
      const r = await api.post(`/simulate-remediation?file_id=${fid}`)
      toast?.(`Saved ${fmtCrore(r.data.financial_liability_saved)} on ${fname}`, 'success')
      setFiles(f => f.filter(x => x.id !== fid)); setTotal(t => t - 1)
    } catch { toast?.('Simulation failed', 'error') }
    setSimulating(null)
  }
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const arr = col => sortBy === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''

  return (
    <div className="page space-y-4">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>Data Files</h1>
          <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>{total} files in DPDP risk inventory</p>
        </div>
        <span className="badge badge-neutral mono">{total} total</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <input className="input" placeholder="Search file paths…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ paddingLeft: 34 }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4E66', fontSize: 14 }}>⌕</span>
        </div>
        <div className="tab-strip">
          {BUCKETS.map(b => <button key={b} className={`tab${bucket === b ? ' active' : ''}`} onClick={() => { setBucket(b); setPage(1) }}>{b === 'all' ? 'All Buckets' : b.replace(/_/g, ' ')}</button>)}
        </div>
        <div className="tab-strip">
          {RISKS.map(r => <button key={r} className={`tab${risk === r ? ' active' : ''}`} onClick={() => { setRisk(r); setPage(1) }}>{r === 'all' ? 'All Risk' : r}</button>)}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <SkeletonRows count={8} /> : files.length === 0 ? (
          <div className="empty-state"><div className="icon">📂</div><h3>No files</h3><p>Adjust filters or run a scan</p></div>
        ) : (
          <table className="tbl">
            <thead><tr>
              <th><button onClick={() => toggleSort('file_name')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0 }}>FILE{arr('file_name')}</button></th>
              <th>BUCKET</th><th>PII</th>
              <th><button onClick={() => toggleSort('risk_score')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0 }}>RISK{arr('risk_score')}</button></th>
              <th><button onClick={() => toggleSort('financial_liability')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0 }}>LIABILITY{arr('financial_liability')}</button></th>
              <th style={{ width: 100 }}>ACTION</th>
            </tr></thead>
            <tbody>
              {files.map(f => {
                const isExp = expanded === f.id
                return (<>
                  <tr key={f.id} onClick={() => setExpanded(isExp ? null : f.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#111927', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#6B7B94', flexShrink: 0 }}>📄</div>
                        <div>
                          <div className="font-600 truncate" style={{ fontSize: 13, maxWidth: 200, color: '#E8ECF4' }} title={f.file_name}>{f.file_name}</div>
                          <div style={{ fontSize: 11, color: '#3D4E66', marginTop: 2 }}>{f.file_extension} · {(f.file_size_bytes / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono" style={{ fontSize: 12, color: '#6B7B94' }}>{f.bucket_name.replace(/_/g, ' ')}</span></td>
                    <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(f.pii_tags || []).slice(0, 2).map(t => <span key={t} className="badge badge-info" style={{ fontSize: 10 }}>{t}</span>)}{(f.pii_tags || []).length > 2 && <span style={{ fontSize: 11, color: '#3D4E66' }}>+{f.pii_tags.length - 2}</span>}</div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 5, background: '#1A2435', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, (f.risk_score / 30) * 100)}%`, background: RISK_COLORS[f.risk_level] }} /></div>
                        <span className={riskBadgeClass(f.risk_level)}>{f.risk_level}</span>
                      </div>
                    </td>
                    <td><span className="mono font-700" style={{ color: f.financial_liability > 0 ? '#EF4444' : '#3D4E66', fontSize: 13 }}>{f.financial_liability > 0 ? fmtCrore(f.financial_liability) : '—'}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" disabled={simulating === f.id} onClick={() => simulate(f.id, f.file_name)}>
                        {simulating === f.id ? '…' : 'Remediate'}
                      </button>
                    </td>
                  </tr>
                  {isExp && <tr key={`${f.id}-x`}><td colSpan={6} style={{ background: '#0D1420', padding: '16px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, fontSize: 12 }}>
                      {[['SENSITIVITY', f.sensitivity?.toFixed(2)], ['EXPOSURE ×', f.exposure?.toFixed(2)], ['STALENESS ×', f.staleness?.toFixed(2)], ['MODIFIED', fmtDate(f.last_modified)]].map(([k, v]) => (<div key={k}><div className="mono" style={{ fontSize: 10, color: '#3D4E66', marginBottom: 4 }}>{k}</div><div className="font-700" style={{ color: '#E8ECF4' }}>{v ?? '—'}</div></div>))}
                      <div style={{ gridColumn: '1/-1' }}><div className="mono" style={{ fontSize: 10, color: '#3D4E66', marginBottom: 4 }}>FILE PATH</div><div className="mono" style={{ fontSize: 11, color: '#00D4AA', wordBreak: 'break-all' }}>{f.file_path}</div></div>
                    </div>
                  </td></tr>}
                </>)
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span className="mono" style={{ fontSize: 12, color: '#3D4E66' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
