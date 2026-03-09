<<<<<<< HEAD
import { useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import BootScreen from './components/BootScreen'
import Dashboard from './pages/Dashboard'
import FilesPage from './pages/FilesPage'
import AlertsPage from './pages/AlertsPage'
import PoliciesPage from './pages/PoliciesPage'
import AuditPage from './pages/AuditPage'
import ScanHistoryPage from './pages/ScanHistoryPage'
import { api } from './utils/api'

const TITLES = {
  '/': 'Dashboard', '/files': 'Data Files', '/alerts': 'Alerts',
  '/policies': 'Policies', '/audit': 'Audit Trail', '/scans': 'Scan History',
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const [scanStatus, setScanStatus] = useState('idle')
  const [toasts, setToasts] = useState([])
  const [searchVal, setSearchVal] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const addToast = (msg, type = 'info') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id))

  const handleScan = async () => {
    if (scanStatus === 'scanning') return
    setScanStatus('scanning')
    try {
      const r = await api.post('/scan')
      addToast(`Scan complete: ${r.data.files_scanned} files · ${r.data.critical_risk_files + r.data.high_risk_files} high/critical`, 'success')
      setScanStatus('done')
    } catch (e) {
      addToast(e.response?.data?.detail ?? 'Scan failed', 'error')
      setScanStatus('idle')
    }
    setTimeout(() => setScanStatus('idle'), 4000)
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/files?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  /* ── Boot screen ── */
  if (!booted) return <BootScreen onComplete={() => setBooted(true)} />

  return (
    <div className="layout">
      <Sidebar scanStatus={scanStatus} onScan={handleScan} />

      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#E8ECF4', letterSpacing: '-0.01em' }}>
              {TITLES[location.pathname] || 'OrdoNexus'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Search - press Enter to go to Files page */}
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="⌕ Search files…"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onKeyDown={handleSearch}
                style={{ width: 200, paddingLeft: 14, fontSize: 12, background: '#111927', border: '1px solid #1C2840' }}
              />
            </div>
            <div style={{ height: 20, width: 1, background: '#1C2840' }} />
            {/* Notifications → alerts page */}
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 8px', position: 'relative' }}
              onClick={() => navigate('/alerts')}
              title="View Alerts"
            >
              🔔
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 7, height: 7, borderRadius: '50%',
                background: '#EF4444', border: '1px solid #0D1420',
              }} />
            </button>
            {/* PDF export */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => window.open('http://localhost:8000/report', '_blank')}
              title="Download PDF compliance report"
            >
              ↓ PDF
            </button>
            <div style={{ height: 20, width: 1, background: '#1C2840' }} />
            {/* User avatar with dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg, #00D4AA, #00B893)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#020408',
                }}>ON</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E8ECF4' }}>Admin</div>
                  <div style={{ fontSize: 10, color: '#3D4E66' }}>OrdoNexus</div>
                </div>
                <span style={{ fontSize: 11, color: '#3D4E66' }}>▼</span>
              </div>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowUserMenu(false)} />
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 200, background: '#0D1420', border: '1px solid #1C2840',
                    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 51, overflow: 'hidden', padding: '6px 0',
                  }}>
                    {[
                      { label: '📊 Dashboard', action: () => navigate('/') },
                      { label: '📄 Data Files', action: () => navigate('/files') },
                      { label: '🔔 Alerts', action: () => navigate('/alerts') },
                      { label: '📋 Audit Trail', action: () => navigate('/audit') },
                      { label: '↓ Export PDF', action: () => window.open('http://localhost:8000/report', '_blank') },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { item.action(); setShowUserMenu(false) }}
                        style={{
                          width: '100%', padding: '10px 16px', border: 'none',
                          background: 'transparent', color: '#A8B5C8', fontSize: 13,
                          fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => e.target.style.background = '#151E2E'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/files" element={<FilesPage toast={addToast} />} />
            <Route path="/alerts" element={<AlertsPage toast={addToast} />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/scans" element={<ScanHistoryPage onScan={handleScan} scanStatus={scanStatus} />} />
          </Routes>
        </div>
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
=======
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
>>>>>>> upstream/main
