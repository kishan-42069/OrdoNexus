import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import Skeleton from '../components/Skeleton'

const S = {
  PASSING: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', icon: '✓', border: 'rgba(34,197,94,0.2)' },
  PARTIAL: { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', icon: '◐', border: 'rgba(234,179,8,0.2)' },
  FAILING: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '✕', border: 'rgba(239,68,68,0.2)' },
}

export default function PoliciesPage() {
  const [pol, setPol] = useState([]); const [ld, setLd] = useState(true); const [exp, setExp] = useState(null)
  useEffect(() => { api.get('/policies').then(r => setPol(r.data.policies ?? [])).catch(console.error).finally(() => setLd(false)) }, [])

  const tc = pol.reduce((a, p) => a + p.checks.length, 0)
  const pc = pol.reduce((a, p) => a + p.checks.filter(c => c.passed).length, 0)
  const cp = tc ? Math.round((pc / tc) * 100) : 0
  const cc = cp >= 70 ? '#22C55E' : cp >= 40 ? '#EAB308' : '#EF4444'

  return (
    <div className="page space-y-4">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>DPDP Policies</h1>
          <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>Digital Personal Data Protection Act</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: cc, letterSpacing: '-0.03em' }}>{cp}%</div>
          <div className="mono" style={{ fontSize: 11, color: '#3D4E66' }}>{pc}/{tc} checks</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {Object.entries(S).map(([k, s]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 13, fontWeight: 600 }}>
            <span>{s.icon}</span> {pol.filter(p => p.status === k).length} {k.charAt(0) + k.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {ld ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={72} />)}</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pol.map(p => {
            const s = S[p.status] || S.PARTIAL; const isE = exp === p.id; const pa = p.checks.filter(c => c.passed).length
            return (
              <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setExp(isE ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', cursor: 'pointer' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span className="mono" style={{ fontSize: 11, color: '#3D4E66' }}>{p.article}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700 }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8ECF4' }}>{p.title}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono font-700" style={{ fontSize: 15, color: '#E8ECF4' }}>{pa}/{p.checks.length}</div>
                    <div style={{ fontSize: 11, color: '#3D4E66' }}>checks</div>
                  </div>
                  <span style={{ color: '#3D4E66', fontSize: 13 }}>{isE ? '▲' : '▼'}</span>
                </div>
                {isE && (
                  <div style={{ borderTop: '1px solid #1C2840', padding: '16px 22px', background: '#0D1420' }}>
                    <p style={{ fontSize: 13, color: '#6B7B94', marginBottom: 14, lineHeight: 1.5 }}>{p.description}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {p.checks.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 7, background: c.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: c.passed ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{c.passed ? '✓' : '✕'}</div>
                          <span style={{ fontSize: 13, color: c.passed ? '#E8ECF4' : '#6B7B94' }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="info-box"><strong>Reference: </strong>DPDP Act, 2023. Penalties up to ₹250 Crore per violation.</div>
    </div>
  )
}
