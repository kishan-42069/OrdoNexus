/**
 * Shadow Data Grid Component
 * Displays table of scanned files with risk scores and PII tags
 */
import React from 'react'

const ShadowDataGrid = ({ files, loading, onSimulateRemediation }) => {
    if (loading) {
        return (
            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-6">Shadow Data Inventory</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-slate-700 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (files.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No Files Scanned Yet</h3>
                <p className="text-slate-400">Click "Trigger Scan" to start discovering shadow data</p>
            </div>
        )
    }

    const getRiskBadgeClass = (level) => {
        switch (level) {
            case 'HIGH':
                return 'badge-high'
            case 'MEDIUM':
                return 'badge-medium'
            case 'LOW':
                return 'badge-low'
            default:
                return 'badge-low'
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(amount)
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Shadow Data Inventory</h2>
                <span className="text-slate-400 text-sm">{files.length} files discovered</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-300 font-semibold">File Name</th>
                            <th className="text-left py-3 px-4 text-slate-300 font-semibold">Bucket</th>
                            <th className="text-left py-3 px-4 text-slate-300 font-semibold">PII Found</th>
                            <th className="text-center py-3 px-4 text-slate-300 font-semibold">Risk Score</th>
                            <th className="text-center py-3 px-4 text-slate-300 font-semibold">Risk Level</th>
                            <th className="text-right py-3 px-4 text-slate-300 font-semibold">Liability</th>
                            <th className="text-center py-3 px-4 text-slate-300 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <tr
                                key={file.id}
                                className="border-b border-slate-700/50 hover:bg-white/5 transition-colors"
                            >
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">📄</span>
                                        <span className="font-medium text-white">{file.file_name}</span>
                                    </div>
                                </td>

                                <td className="py-4 px-4">
                                    <span className="text-slate-400 text-sm">{file.bucket_name}</span>
                                </td>

                                <td className="py-4 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {file.pii_tags.length > 0 ? (
                                            file.pii_tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-2 py-0.5 rounded text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-sm">No PII</span>
                                        )}
                                    </div>
                                </td>

                                <td className="py-4 px-4 text-center">
                                    <span className="text-white font-semibold text-lg">
                                        {file.risk_score.toFixed(1)}
                                    </span>
                                </td>

                                <td className="py-4 px-4 text-center">
                                    <span className={getRiskBadgeClass(file.risk_level)}>
                                        {file.risk_level}
                                    </span>
                                </td>

                                <td className="py-4 px-4 text-right">
                                    <span className="text-red-400 font-semibold">
                                        {formatCurrency(file.financial_liability)}
                                    </span>
                                </td>

                                <td className="py-4 px-4 text-center">
                                    <button
                                        onClick={() => onSimulateRemediation(file.id)}
                                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold py-1.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        Simulate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Risk Score Legend */}
            <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-6 text-sm">
                    <span className="text-slate-400">Risk Formula:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400">Sensitivity</span>
                        <span className="text-slate-500">×</span>
                        <span className="text-yellow-400">Exposure</span>
                        <span className="text-slate-500">×</span>
                        <span className="text-purple-400">Staleness</span>
                    </div>
                    <div className="ml-auto flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-400">High (≥20)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400">Medium (10-20)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-400">Low (&lt;10)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShadowDataGrid
