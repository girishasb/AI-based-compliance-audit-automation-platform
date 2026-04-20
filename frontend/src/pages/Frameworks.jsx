import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const FRAMEWORK_COLORS = {
    'ISO 27001': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🔒' },
    'SOC 2': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: '✅' },
    'HIPAA': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: '🏥' },
    'DPDP': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '🇮🇳' },
}

export default function Frameworks() {
    const [frameworks, setFrameworks] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/frameworks').then(r => { setFrameworks(r.data); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

    return (
        <div className="page-container animate-fade">
            <div className="page-header">
                <h1 className="page-title">Compliance Frameworks</h1>
                <p className="page-subtitle">Select a framework to manage controls, track compliance, and generate audit reports</p>
            </div>

            <div className="frameworks-grid">
                {frameworks.map(fw => {
                    const style = FRAMEWORK_COLORS[fw.name] || { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: '📋' }
                    return (
                        <div key={fw.id} className="framework-card" onClick={() => navigate(`/controls/${fw.id}`)}>
                            <div className="framework-badge" style={{ background: style.bg, color: style.color }}>
                                <span>{style.icon}</span>
                                <span>{fw.name}</span>
                            </div>
                            <div className="framework-name">{fw.name}</div>
                            <div className="framework-desc">{fw.description}</div>
                            <div className="framework-meta">
                                <span>📋 {fw.total_controls} Controls</span>
                                <span>📄 {fw.version}</span>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}
                                    onClick={e => { e.stopPropagation(); navigate(`/controls/${fw.id}`) }}>
                                    Manage Controls →
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
