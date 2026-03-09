import axios from 'axios'

const BASE = 'http://localhost:8000'
export const api = axios.create({ baseURL: BASE, timeout: 20000 })

// ── Formatters ─────────────────────────────────────────────────────
export const fmtCrore = (v = 0) => {
  const cr = v / 1e7
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(1)}L Cr`
  if (cr >= 1000)   return `₹${(cr / 1000).toFixed(1)}K Cr`
  if (cr >= 1)      return `₹${cr.toFixed(1)} Cr`
  return `₹${cr.toFixed(2)} Cr`
}

export const fmtNum = (n = 0) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const riskColor = (level) => ({
  CRITICAL: 'var(--critical)',
  HIGH:     'var(--high)',
  MEDIUM:   'var(--medium)',
  LOW:      'var(--low)',
}[level] || 'var(--text-muted)')

export const riskBadgeClass = (level) => ({
  CRITICAL: 'badge badge-critical',
  HIGH:     'badge badge-high',
  MEDIUM:   'badge badge-medium',
  LOW:      'badge badge-low',
}[level] || 'badge badge-neutral')

export const severityBadgeClass = (sev) => ({
  CRITICAL: 'badge badge-critical',
  HIGH:     'badge badge-high',
  MEDIUM:   'badge badge-medium',
  INFO:     'badge badge-info',
  WARN:     'badge badge-medium',
  DEBUG:    'badge badge-neutral',
}[sev] || 'badge badge-neutral')

export const scoreColor = (s) =>
  s >= 70 ? 'var(--success)' : s >= 40 ? 'var(--warn)' : 'var(--danger)'
