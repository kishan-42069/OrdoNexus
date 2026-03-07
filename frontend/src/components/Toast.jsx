import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => { const t = setTimeout(() => onClose?.(), 5000); return () => clearTimeout(t) }, [])

  const C = {
    success: { bg: 'rgba(34,197,94,0.1)', border: '#22C55E', color: '#86EFAC', icon: '✓' },
    error: { bg: 'rgba(239,68,68,0.1)', border: '#EF4444', color: '#FCA5A5', icon: '✕' },
    info: { bg: 'rgba(59,130,246,0.1)', border: '#3B82F6', color: '#93C5FD', icon: 'ⓘ' },
    warn: { bg: 'rgba(234,179,8,0.1)', border: '#EAB308', color: '#FDE68A', icon: '⚠' },
  }
  const c = C[type] || C.info

  return (
    <div className="fade-up" style={{
      background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.color,
      padding: '12px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 280, maxWidth: 420,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
      fontSize: 13, fontWeight: 500,
    }}>
      <span style={{ fontSize: 15 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, opacity: 0.5, fontSize: 14, padding: 3 }}>✕</button>
    </div>
  )
}
