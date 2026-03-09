import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IcDash /> },
  { to: '/files', label: 'Data Files', icon: <IcFiles /> },
  { to: '/alerts', label: 'Alerts', icon: <IcAlert /> },
  { to: '/policies', label: 'Policies', icon: <IcPolicy /> },
  { to: '/audit', label: 'Audit Trail', icon: <IcAudit /> },
  { to: '/scans', label: 'Scan History', icon: <IcScan /> },
]

export default function Sidebar({ scanStatus, onScan }) {
  const scanning = scanStatus === 'scanning'
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '26px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #00D4AA, #00B893)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#020408',
            boxShadow: '0 0 24px rgba(0,212,170,0.25)',
          }}>ON</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#E8ECF4', letterSpacing: '-0.02em' }}>OrdoNexus</div>
            <div style={{ fontSize: 10, color: '#3D4E66', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>DPDP Compliance</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Scan button */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onScan} disabled={scanning}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10, border: 'none', cursor: scanning ? 'not-allowed' : 'pointer',
            background: scanning ? 'var(--accent-dim)' : 'linear-gradient(135deg, #00D4AA, #00B893)',
            color: scanning ? 'var(--accent)' : '#020408',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            boxShadow: scanning ? 'none' : '0 0 20px rgba(0,212,170,0.2)',
            transition: 'all 0.15s',
          }}
        >
          {scanning ? <><Spinner /> Scanning…</> : <>▶ Run Full Scan</>}
        </button>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: scanning ? '#EAB308' : '#22C55E',
            boxShadow: `0 0 6px ${scanning ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'}`,
          }} className={scanning ? 'pulse' : ''} />
          <span style={{ fontSize: 11, color: '#3D4E66' }}>
            {scanning ? 'Scan in progress' : 'System operational'}
          </span>
        </div>
      </div>

      {/* Dark mode toggle area */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4AA' }} />
        <span style={{ fontSize: 11, color: '#3D4E66', fontFamily: 'JetBrains Mono' }}>Dark mode</span>
      </div>
    </aside>
  )
}

function IcDash() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="7" height="7" rx="2" /><rect x="10" y="1" width="7" height="7" rx="2" /><rect x="1" y="10" width="7" height="7" rx="2" /><rect x="10" y="10" width="7" height="7" rx="2" /></svg> }
function IcFiles() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 1H4a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-6-6z" /><path d="M10 1v6h6" /></svg> }
function IcAlert() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1L1 15h16L9 1z" /><path d="M9 7v4M9 13v1" strokeLinecap="round" /></svg> }
function IcPolicy() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1L3 3.5v5c0 4 2.5 6.5 6 7.5 3.5-1 6-3.5 6-7.5V3.5L9 1z" /></svg> }
function IcAudit() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4.5h14M2 9h10M2 13.5h6" strokeLinecap="round" /></svg> }
function IcScan() { return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="7" /><path d="M9 5v4l2.5 2.5" strokeLinecap="round" /></svg> }
function Spinner() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="22" strokeDashoffset="10" /></svg> }
