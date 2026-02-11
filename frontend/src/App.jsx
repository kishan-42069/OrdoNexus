/**
 * OrdoNexus Frontend - Main Application Component
 * Shadow Data Governance Platform for DPDP Compliance
 */
import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import ShadowDataGrid from './components/ShadowDataGrid'
import RemediationModal from './components/RemediationModal'

const API_BASE_URL = 'http://localhost:8000'

function App() {
    const [files, setFiles] = useState([])
    const [gamification, setGamification] = useState(null)
    const [loading, setLoading] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [remediationResult, setRemediationResult] = useState(null)

    // Fetch files on component mount
    useEffect(() => {
        fetchFiles()
        fetchGamification()
    }, [])

    const fetchFiles = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/files`)
            setFiles(response.data)
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchGamification = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/gamification`)
            setGamification(response.data)
        } catch (error) {
            console.error('Error fetching gamification:', error)
        }
    }

    const handleScan = async () => {
        try {
            setScanning(true)
            const response = await axios.post(`${API_BASE_URL}/scan`)
            console.log('Scan completed:', response.data)

            // Refresh data after scan
            await fetchFiles()
            await fetchGamification()

            alert(`✅ Scan completed! ${response.data.files_scanned} files scanned, ${response.data.high_risk_files} high-risk files found.`)
        } catch (error) {
            console.error('Error during scan:', error)
            alert('❌ Scan failed. Please check the console for details.')
        } finally {
            setScanning(false)
        }
    }

    const handleSimulateRemediation = async (fileId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/simulate-remediation?file_id=${fileId}`)
            setRemediationResult(response.data)
            setShowModal(true)

            // Refresh gamification score
            await fetchGamification()
        } catch (error) {
            console.error('Error simulating remediation:', error)
            alert('❌ Remediation simulation failed.')
        }
    }

    const handleDownloadReport = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/report`, {
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'OrdoNexus_DPDP_Compliance_Report.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()

            alert('✅ Report downloaded successfully!')
        } catch (error) {
            console.error('Error downloading report:', error)
            alert('❌ Report download failed.')
        }
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            OrdoNexus
                        </h1>
                        <p className="text-slate-400 mt-1">Shadow Data Governance • DPDP Compliance</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {scanning ? (
                                <>
                                    <span className="inline-block animate-spin mr-2">⚙️</span>
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    🔍 Trigger Scan
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDownloadReport}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            📄 Download Report
                        </button>
                    </div>
                </div>
            </header>

            {/* Dashboard */}
            <Dashboard
                gamification={gamification}
                files={files}
                loading={loading}
            />

            {/* Shadow Data Grid */}
            <ShadowDataGrid
                files={files}
                loading={loading}
                onSimulateRemediation={handleSimulateRemediation}
            />

            {/* Remediation Modal */}
            {showModal && remediationResult && (
                <RemediationModal
                    result={remediationResult}
                    onClose={() => {
                        setShowModal(false)
                        setRemediationResult(null)
                    }}
                />
            )}
        </div>
    )
}

export default App
