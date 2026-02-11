/**
 * Dashboard Component
 * Displays gamification score and risk metrics
 */
import React from 'react'

const Dashboard = ({ gamification, files, loading }) => {
    if (loading || !gamification) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        )
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Calculate score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 50) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getScoreGradient = (score) => {
        if (score >= 80) return 'from-green-500 to-emerald-600'
        if (score >= 50) return 'from-yellow-500 to-orange-600'
        return 'from-red-500 to-rose-600'
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Data Responsibility Score */}
            <div className="glass-card p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-300 text-sm font-medium">Data Responsibility Score</h3>
                    <span className="text-2xl">🎯</span>
                </div>

                <div className="flex items-end gap-2">
                    <span className={`text-5xl font-bold ${getScoreColor(gamification.responsibility_score)}`}>
                        {gamification.responsibility_score}
                    </span>
                    <span className="text-slate-400 text-xl mb-2">/100</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${getScoreGradient(gamification.responsibility_score)} transition-all duration-500`}
                        style={{ width: `${gamification.responsibility_score}%` }}
                    ></div>
                </div>

                <div className="mt-4 flex justify-between text-xs text-slate-400">
                    <span>Scans: {gamification.scans_performed}</span>
                    <span>Remediated: {gamification.high_risk_files_remediated}</span>
                </div>
            </div>

            {/* Total Financial Liability */}
            <div className="glass-card p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-300 text-sm font-medium">Total Financial Liability</h3>
                    <span className="text-2xl">💰</span>
                </div>

                <div className="text-3xl font-bold text-red-400">
                    {formatCurrency(gamification.total_financial_liability)}
                </div>

                <div className="mt-4 text-sm text-slate-400">
                    Potential DPDP penalties for current shadow data
                </div>

                {gamification.total_financial_liability > 0 && (
                    <div className="mt-3 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs">
                        ⚠️ High Risk Exposure
                    </div>
                )}
            </div>

            {/* Risk Overview */}
            <div className="glass-card p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-300 text-sm font-medium">Risk Overview</h3>
                    <span className="text-2xl">📊</span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total Files</span>
                        <span className="text-white font-semibold">{gamification.total_files}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">High Risk</span>
                        <span className="badge-high">{gamification.high_risk_files}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total Risk Score</span>
                        <span className="text-orange-400 font-semibold">{gamification.total_risk}</span>
                    </div>
                </div>

                {gamification.high_risk_files > 0 && (
                    <div className="mt-4 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                        💡 Immediate action recommended
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
