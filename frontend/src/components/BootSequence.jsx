import { useState, useEffect } from 'react'

const LINES = [
  '> INITIALIZING ORDONEXUS v2.0.0...',
  '> LOADING DPDP COMPLIANCE ENGINE...',
  '> CONNECTING TO DATA INFRASTRUCTURE...',
  '> PII CLASSIFICATION PATTERNS: LOADED',
  '> RISK SCORING ENGINE: READY',
  '> AUDIT TRAIL: INITIALIZED',
  '> ALL SYSTEMS OPERATIONAL',
]

export default function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([])
  const [done, setDone] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < LINES.length) {
        setLines(prev => [...prev, LINES[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setFadeOut(true)
          setTimeout(onComplete, 600)
        }, 500)
        setDone(true)
      }
    }, 220)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: '#080B12',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="w-full max-w-lg px-8">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #0066CC 100%)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span className="font-display text-xl font-700 tracking-tight text-white">OrdoNexus</span>
          </div>
          <div className="text-xs font-mono text-muted tracking-widest uppercase">
            Shadow Data Governance Intelligence
          </div>
        </div>

        {/* Terminal */}
        <div className="rounded-xl border border-border overflow-hidden"
          style={{ background: 'rgba(14,20,32,0.8)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-danger opacity-70" />
            <div className="w-3 h-3 rounded-full bg-warn opacity-70" />
            <div className="w-3 h-3 rounded-full bg-success opacity-70" />
            <span className="ml-2 text-xs font-mono text-muted">ordonexus — boot</span>
          </div>
          <div className="p-5 font-mono text-sm space-y-1.5 min-h-[200px]">
            {lines.map((line, i) => (
              <div key={i} className="text-accent" style={{ animationDelay: `${i * 0.05}s` }}>
                {i === lines.length - 1 && done
                  ? <span style={{ color: '#10B981' }}>{line} ✓</span>
                  : <span style={{ color: i < lines.length - 1 ? '#64748B' : '#00D4FF' }}>{line}</span>
                }
              </div>
            ))}
            {!done && (
              <span className="inline-block w-2 h-4 bg-accent"
                style={{ animation: 'boot-flicker 0.8s infinite' }} />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-px bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(lines.length / LINES.length) * 100}%`,
              background: 'linear-gradient(90deg, #00D4FF, #0066CC)',
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-mono text-muted">
          <span>SYSTEM BOOT</span>
          <span>{Math.round((lines.length / LINES.length) * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
