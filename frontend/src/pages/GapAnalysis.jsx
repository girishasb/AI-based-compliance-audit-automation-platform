import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

function SeverityBadge({ severity }) {
    const cls = severity === 'High' ? 'sev-high' : severity === 'Medium' ? 'sev-medium' : 'sev-low'
    const icon = severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢'
    return <span className={`status-badge ${cls}`}>{icon} {severity}</span>
}

export default function GapAnalysis() {
    const { frameworkId } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')
    const [framework, setFramework] = useState(null)

    useEffect(() => {
        Promise.all([
            api.get(`/frameworks/${frameworkId}`),
            api.get(`/gaps/${frameworkId}`)
        ]).then(([fw, gap]) => {
            setFramework(fw.data)
            setData(gap.data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [frameworkId])

    if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

    const gaps = data?.gaps || []
    const filtered = filter === 'All' ? gaps : gaps.filter(g => g.severity === filter)

    return (
        <div className="page-container animate-fade">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button onClick={() => navigate(`/controls/${frameworkId}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', padding: 0 }}>← Back to Controls</button>
                    <h1 className="page-title">AI Gap Analysis</h1>
                    <p className="page-subtitle">{framework?.name} · {data?.total_gaps} gaps identified</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/reports/${frameworkId}`)}>Generate PDF Report →</button>
            </div>

            {/* Gap Summary Cards */}
            <div className="gap-summary-row">
                <div className="gap-stat-card">
                    <div className="gap-stat-number" style={{ color: 'var(--red-400)' }}>{data?.high_risk || 0}</div>
                    <div className="gap-stat-label">High Risk</div>
                    <div style={{ marginTop: '0.5rem' }}><span className="status-badge sev-high">🔴 Critical</span></div>
                </div>
                <div className="gap-stat-card">
                    <div className="gap-stat-number" style={{ color: 'var(--orange-400)' }}>{data?.medium_risk || 0}</div>
                    <div className="gap-stat-label">Medium Risk</div>
                    <div style={{ marginTop: '0.5rem' }}><span className="status-badge sev-medium">🟡 Moderate</span></div>
                </div>
                <div className="gap-stat-card">
                    <div className="gap-stat-number" style={{ color: 'var(--yellow-400)' }}>{data?.low_risk || 0}</div>
                    <div className="gap-stat-label">Low Risk</div>
                    <div style={{ marginTop: '0.5rem' }}><span className="status-badge sev-low">🟢 Low</span></div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="controls-filter" style={{ marginBottom: '1.25rem' }}>
                {['All', 'High', 'Medium', 'Low'].map(s => (
                    <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'All' ? `All (${gaps.length})` : `${s} (${gaps.filter(g => g.severity === s).length})`}</button>
                ))}
            </div>

            {/* Gap Items */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div>No gaps found for this filter. Great work!</div>
                </div>
            ) : (
                filtered.map((gap, i) => (
                    <div key={i} className="gap-item">
                        <div className="gap-item-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                                    <span className="gap-ctrl-id">{gap.control_id}</span>
                                    <span className="gap-ctrl-name">{gap.control_name}</span>
                                    {gap.is_critical && <span className="critical-badge">⚠ Critical</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span>📂 {gap.category}</span>
                                    <span>·</span>
                                    <span>Status: {gap.status}</span>
                                </div>
                            </div>
                            <SeverityBadge severity={gap.severity} />
                        </div>
                        <div className="gap-remediation">
                            <strong>💡 Remediation: </strong>{gap.remediation}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
