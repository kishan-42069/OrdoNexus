export default function ScoreRing({ score = 0, size = 80 }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#FF3B5C'
  const label = score >= 90 ? 'ELITE' : score >= 70 ? 'SECURE' : score >= 40 ? 'AT RISK' : 'CRITICAL'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2A3A" strokeWidth="8"/>
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94), stroke 0.4s' }}
        />
      </svg>
      <div className="text-center -mt-1" style={{ marginTop: `-${size/2 + 20}px`, pointerEvents: 'none' }}>
        <div className="font-display font-700 text-xl leading-none" style={{ color }}>{score}</div>
        <div className="text-xs font-mono mt-0.5" style={{ color, opacity: 0.8 }}>{label}</div>
      </div>
    </div>
  )
}
