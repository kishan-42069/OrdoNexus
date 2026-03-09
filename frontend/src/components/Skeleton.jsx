export default function Skeleton({ height = 48, radius = 6, className = '', style = {} }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ height, borderRadius: radius, ...style }}
        />
    )
}

export function SkeletonText({ lines = 3, gap = 8 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} height={12} style={{ width: i === lines - 1 ? '60%' : '100%' }} />
            ))}
        </div>
    )
}

export function SkeletonCard({ count = 4 }) {
    return (
        <div className="stat-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton height={10} style={{ width: '50%' }} />
                    <Skeleton height={28} style={{ width: '70%' }} />
                    <Skeleton height={10} style={{ width: '40%' }} />
                </div>
            ))}
        </div>
    )
}

export function SkeletonRows({ count = 6 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <Skeleton height={14} style={{ width: '28%' }} />
                    <Skeleton height={14} style={{ width: '15%' }} />
                    <Skeleton height={14} style={{ width: '20%' }} />
                    <Skeleton height={14} style={{ width: '18%' }} />
                    <Skeleton height={14} style={{ width: '12%' }} />
                </div>
            ))}
        </div>
    )
}
