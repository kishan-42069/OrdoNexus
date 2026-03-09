import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { api, fmtCrore, fmtNum, riskBadgeClass } from '../utils/api'
import { SkeletonCard } from '../components/Skeleton'
import Skeleton from '../components/Skeleton'

const RC = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#22C55E' }

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0D1420', border: '1px solid #1C2840', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ color: '#3D4E66', fontSize: 10, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const ACT = {
  SCAN: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', icon: '⟳' },
  SCAN_COMPLETED: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', icon: '⟳' },
  SIMULATE_REMEDIATION: { bg: 'rgba(234,179,8,0.1)', color: '#EAB308', icon: '⚡' },
  REPORT_GENERATED: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', icon: '↓' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [gamif, setGamif] = useState(null)
  const [trends, setTrends] = useState([])
  const [activity, setActivity] = useState([])
  const [topFiles, setTopFiles] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'), api.get('/gamification'),
      api.get('/trends'), api.get('/recent-activity'),
      api.get('/top-risky-files'), api.get('/analytics/overview'),
    ]).then(([s, g, t, act, tf, an]) => {
      setSummary(s.data); setGamif(g.data)
      setTrends(t.data.trends.slice(-30).map(d => ({
        date: d.date.slice(5),
        'Risk Score': parseFloat(d.risk_score) || 0,
        'Files at Risk': d.files_at_risk || 0,
      })))
      setActivity(act.data.events ?? [])
      setTopFiles(tf.data.files ?? [])
      setAnalytics(an.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page space-y-5">
      <Skeleton height={28} style={{ width: 250 }} />
      <SkeletonCard count={3} />
      <div className="grid-2-1"><Skeleton height={320} /><Skeleton height={320} /></div>
      <div className="grid-2"><Skeleton height={280} /><Skeleton height={280} /></div>
    </div>
  )

  const rd = summary?.risk_distribution || {}
  const totalFiles = summary?.total_files ?? 0
  const liability = summary?.total_liability ?? 0
  const piiCount = summary?.total_pii_instances ?? 0
  const score = gamif?.responsibility_score ?? 0
  const pii = summary?.pii_breakdown || {}
  const piiBar = Object.entries(pii).filter(([, v]) => v > 0).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), count: v,
  }))
  const pie = [
    { name: 'CRITICAL', value: rd.critical || 0 },
    { name: 'HIGH', value: rd.high || 0 },
    { name: 'MEDIUM', value: rd.medium || 0 },
    { name: 'LOW', value: rd.low || 0 },
  ].filter(d => d.value > 0)
  const buckets = Object.entries(summary?.bucket_stats || {}).map(([n, s]) => ({
    name: n.replace(/_/g, ' '), files: s.count, liability: s.total_liability,
  }))

  return (
    <div className="page space-y-5">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8ECF4' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#6B7B94', marginTop: 3 }}>Real-time DPDP compliance intelligence</p>
        </div>
        {analytics?.last_scan_at && (
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 11, color: '#3D4E66' }}>Last scan</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#A8B5C8' }}>
              {new Date(analytics.last_scan_at).toLocaleString()} · {analytics.last_scan_files} files
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card kpi-card card-accent fade-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="kpi-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>₹</div>
          <div className="kpi-label">Total Liability</div>
          <div className="kpi-value" style={{ color: '#00D4AA' }}>{fmtCrore(liability)}</div>
          <div className="kpi-trend up">↑ DPDP Exposure</div>
          <div className="kpi-footer" onClick={() => window.open('http://localhost:8000/report', '_blank')}>View Report →</div>
        </div>
        <div className="card kpi-card fade-up" style={{ animationDelay: '80ms', opacity: 0 }}>
          <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>⊡</div>
          <div className="kpi-label">PII Instances</div>
          <div className="kpi-value">{fmtNum(piiCount)}</div>
          <div className="kpi-trend flat">{analytics?.remediated_week ?? 0} remediated this week</div>
          <div className="kpi-footer" onClick={() => navigate('/alerts')}>View Alerts →</div>
        </div>
        <div className="card kpi-card fade-up" style={{ animationDelay: '160ms', opacity: 0 }}>
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>◫</div>
          <div className="kpi-label">Active Files</div>
          <div className="kpi-value">{fmtNum(totalFiles)}</div>
          <div className="kpi-trend down">↓ {analytics?.scans_week ?? 0} scans this week</div>
          <div className="kpi-footer" onClick={() => navigate('/files')}>View Files →</div>
        </div>
      </div>

      {/* Analytics chart + System card */}
      <div className="grid-2-1">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div className="chart-title">Money Flow</div>
              <div className="chart-big-num" style={{ marginTop: 6 - 3, color: '#00D4AA' }}>{fmtCrore(liability)}</div>
              <div className="chart-sub">30-day risk trend</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#3D4E66' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 3, borderRadius: 2, background: '#00D4AA' }} /> Risk Score
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 3, borderRadius: 2, background: '#3B82F6' }} /> Files at Risk
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2840" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#3D4E66', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={5} />
              <YAxis tick={{ fill: '#3D4E66', fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="Risk Score" stroke="#00D4AA" strokeWidth={2.5} fill="url(#gTeal)" dot={false} activeDot={{ r: 5, fill: '#00D4AA', stroke: '#0D1420', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="Files at Risk" stroke="#3B82F6" strokeWidth={1.5} fill="url(#gBlu)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* System card */}
          <div className="sys-card fade-up" style={{ animationDelay: '200ms', opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>COMPLIANCE</div>
              <div style={{ fontSize: 11, opacity: 0.4 }}>DPDP '23</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: 10, opacity: 0.4 }}>●●●●</span>
              <span style={{ fontSize: 10, opacity: 0.4 }}>●●●●</span>
              <span style={{ fontSize: 10, opacity: 0.4 }}>●●●●</span>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#00D4AA', letterSpacing: '0.05em' }}>{score}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div><div style={{ fontSize: 10, opacity: 0.4, marginBottom: 2 }}>Organization</div><div style={{ fontSize: 13, fontWeight: 600 }}>OrdoNexus Corp</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, opacity: 0.4, marginBottom: 2 }}>Score</div><div style={{ fontSize: 13, fontWeight: 600 }}>{score}/100</div></div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8ECF4', marginBottom: 12 }}>Quick Stats</div>
            {[{ l: 'Scans Performed', v: gamif?.scans_performed ?? 0, c: '#3B82F6' },
            { l: 'Files Remediated', v: gamif?.high_risk_files_remediated ?? 0, c: '#22C55E' },
            { l: 'High/Critical', v: (rd.high || 0) + (rd.critical || 0), c: '#EF4444' },
            ].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #1C2840' }}>
                <span style={{ fontSize: 13, color: '#6B7B94' }}>{s.l}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: s.c, fontFamily: 'JetBrains Mono' }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics + PII */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div className="chart-title">Statistics</div>
            <a href="/files" style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textDecoration: 'none', border: '1px solid #1C2840', padding: '4px 12px', borderRadius: 6 }}>View all →</a>
          </div>
          {pie.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><div className="icon">○</div><p>No data</p></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ position: 'relative', width: 150, height: 150 }}>
                <PieChart width={150} height={150}>
                  <Pie data={pie} cx={70} cy={70} innerRadius={48} outerRadius={68} dataKey="value" strokeWidth={0}>
                    {pie.map((e, i) => <Cell key={i} fill={RC[e.name]} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#E8ECF4' }}>{totalFiles}</span>
                  <span style={{ fontSize: 10, color: '#3D4E66' }}>Files</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pie.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: RC[p.name] }} />
                      <span style={{ fontSize: 13, color: '#A8B5C8' }}>{p.name}</span>
                    </div>
                    <span className="mono font-700" style={{ color: '#E8ECF4' }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="chart-header"><div className="chart-title">PII Categories</div><div className="chart-sub">Sensitive data detected</div></div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={piiBar} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2840" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#3D4E66', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D4E66', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" fill="#00D4AA" radius={[6, 6, 0, 0]} name="Instances" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Your Cards (Top Files) + Recent Activity */}
      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1C2840' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8ECF4' }}>Your Cards</div>
            <a href="/files" style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          {topFiles.length === 0 ? (
            <div className="empty-state"><div className="icon">📂</div><p>No data</p></div>
          ) : (
            <div>
              {topFiles.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: i === topFiles.length - 1 ? 'none' : '1px solid rgba(28,40,64,0.5)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#111927', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#6B7B94', flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>{f.file_name}</div>
                    <div style={{ fontSize: 11, color: '#3D4E66', marginTop: 2 }}>{f.bucket_name.replace(/_/g, ' ')}</div>
                  </div>
                  <span className={riskBadgeClass(f.risk_level)}>{f.risk_level}</span>
                  <span className="mono font-700" style={{ color: '#EF4444', fontSize: 13 }}>{fmtCrore(f.liability)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1C2840' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8ECF4' }}>Recent Activity</div>
            <a href="/audit" style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textDecoration: 'none' }}>View all</a>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No activity</p></div>
          ) : (
            <div>
              {activity.slice(0, 5).map((e, i) => {
                const ac = ACT[e.type] || { bg: 'rgba(107,123,148,0.1)', color: '#6B7B94', icon: '·' }
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderBottom: i === Math.min(4, activity.length - 1) ? 'none' : '1px solid rgba(28,40,64,0.5)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: ac.bg, color: ac.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ac.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 13, fontWeight: 500, color: '#E8ECF4' }}>{e.desc}</div>
                      <div style={{ fontSize: 11, color: '#3D4E66', marginTop: 1 }}>{e.user}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: '#3D4E66' }}>
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
