/**
 * Remediation Modal Component
 * Displays "What-If" analysis results
 */
import React from 'react'

const RemediationModal = ({ result, onClose }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 max-w-2xl w-full animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Remediation Simulation</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* File Info */}
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📄</span>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{result.file_name}</h3>
                            <p className="text-sm text-slate-400">Current Risk Score: {result.current_risk.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                {/* Impact Analysis */}
                <div className="space-y-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-green-300 font-medium">Risk Reduction</span>
                            <span className="text-2xl font-bold text-green-400">-{result.risk_reduction.toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-300 font-medium">Financial Liability Saved</span>
                            <span className="text-2xl font-bold text-blue-400">
                                {formatCurrency(result.financial_liability_saved)}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-purple-300 font-medium">New Responsibility Score</span>
                            <span className="text-2xl font-bold text-purple-400">
                                {result.new_responsibility_score}/100
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                            <h4 className="text-yellow-300 font-semibold mb-1">Recommendation</h4>
                            <p className="text-slate-300">{result.recommendation}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            alert('In production, this would trigger actual remediation workflow.')
                            onClose()
                        }}
                        className="flex-1 btn-primary"
                    >
                        Proceed with Remediation
                    </button>
                </div>

                {/* Disclaimer */}
                <p className="mt-4 text-xs text-slate-500 text-center">
                    This is a simulation. No actual files were modified.
                </p>
            </div>
        </div>
    )
}

export default RemediationModal
