import { useState, useEffect, useRef } from 'react'

const BOOT_LINES = [
    { text: '> Initializing OrdoNexus Engine v2.0.0', cls: 'info', delay: 0 },
    { text: '  ├─ Loading core modules...', cls: 'dim', delay: 200 },
    { text: '  ├─ Connecting to PostgreSQL ████████ OK', cls: 'ok', delay: 500 },
    { text: '  ├─ Loading DPDP policy engine...', cls: 'dim', delay: 700 },
    { text: '  │  ├─ Article 4: Data Minimisation    [LOADED]', cls: '', delay: 900 },
    { text: '  │  ├─ Article 5: Accuracy of Data     [LOADED]', cls: '', delay: 1000 },
    { text: '  │  ├─ Article 6: Storage Limitation   [LOADED]', cls: '', delay: 1100 },
    { text: '  │  ├─ Article 8: Security Safeguards  [LOADED]', cls: '', delay: 1200 },
    { text: '  │  └─ Article 9: Accountability       [LOADED]', cls: '', delay: 1300 },
    { text: '  ├─ PII Detection Engine initialized', cls: 'ok', delay: 1500 },
    { text: '  │  ├─ Aadhaar pattern matcher     ✓', cls: 'ok', delay: 1600 },
    { text: '  │  ├─ PAN pattern matcher          ✓', cls: 'ok', delay: 1700 },
    { text: '  │  ├─ GSTIN pattern matcher        ✓', cls: 'ok', delay: 1750 },
    { text: '  │  └─ Email/Phone/Passport         ✓', cls: 'ok', delay: 1800 },
    { text: '  ├─ Risk Scoring Engine online', cls: 'info', delay: 2000 },
    { text: '  ├─ Mock S3 buckets: 3 mounted', cls: '', delay: 2200 },
    { text: '  │  ├─ finance_private     [CONFIDENTIAL]', cls: 'warn', delay: 2300 },
    { text: '  │  ├─ public_web          [PUBLIC]', cls: '', delay: 2400 },
    { text: '  │  └─ legacy_archive      [RESTRICTED]', cls: 'warn', delay: 2500 },
    { text: '  ├─ Audit logger: TAMPER-PROOF mode ON', cls: 'ok', delay: 2700 },
    { text: '  ├─ Gamification service initialized', cls: 'dim', delay: 2900 },
    { text: '  └─ API server ready on :8000', cls: 'info', delay: 3100 },
    { text: '', cls: 'dim', delay: 3200 },
    { text: '✅ OrdoNexus DPDP Compliance Engine — ONLINE', cls: 'info', delay: 3300 },
    { text: '   Zero-Trust PII · Immutable Audit · Real-time Risk', cls: 'dim', delay: 3500 },
]

export default function BootScreen({ onComplete }) {
    const [visibleLines, setVisibleLines] = useState([])
    const [progress, setProgress] = useState(0)
    const [fading, setFading] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const timers = []
        BOOT_LINES.forEach((line, i) => {
            timers.push(setTimeout(() => {
                setVisibleLines(prev => [...prev, line])
                setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100))
            }, line.delay))
        })

        // Fade out after all lines are shown
        timers.push(setTimeout(() => setFading(true), 3800))
        timers.push(setTimeout(() => onComplete?.(), 4400))

        return () => timers.forEach(clearTimeout)
    }, [])

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [visibleLines])

    return (
        <div className="boot-screen" style={fading ? { animation: 'fadeOut 0.6s ease forwards' } : {}}>
            <div className="boot-scanline" />

            {/* Logo */}
            <div className="boot-logo">
                <div className="boot-logo-icon">ON</div>
                <div>
                    <div className="boot-logo-text">OrdoNexus</div>
                    <div className="boot-logo-sub">DPDP COMPLIANCE ENGINE</div>
                </div>
            </div>

            {/* Console */}
            <div className="boot-console">
                <div className="boot-console-bar">
                    <div className="boot-console-dot" style={{ background: '#EF4444' }} />
                    <div className="boot-console-dot" style={{ background: '#EAB308' }} />
                    <div className="boot-console-dot" style={{ background: '#22C55E' }} />
                    <span style={{ marginLeft: 10, fontSize: 11, color: '#3D4E66', fontFamily: 'JetBrains Mono' }}>ordonexus-engine</span>
                </div>
                <div ref={containerRef} style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {visibleLines.map((line, i) => (
                        <div
                            key={i}
                            className={`boot-line ${line.cls}`}
                            style={{ animationDelay: '0ms' }}
                            dangerouslySetInnerHTML={{ __html: line.text || '&nbsp;' }}
                        />
                    ))}
                    {visibleLines.length < BOOT_LINES.length && (
                        <span style={{ color: '#00D4AA', animation: 'pulseDot 0.8s ease-in-out infinite' }}>▌</span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="boot-progress">
                <div className="boot-progress-track">
                    <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="boot-status">
                    {progress < 100
                        ? `Initializing subsystems... ${progress}%`
                        : 'All systems operational — launching dashboard'
                    }
                </div>
            </div>
        </div>
    )
}
