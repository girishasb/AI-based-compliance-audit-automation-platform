import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Reports() {
    const { frameworkId } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [framework, setFramework] = useState(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get(`/frameworks/${frameworkId}`),
            api.get(`/reports/${frameworkId}`)
        ]).then(([fw, r]) => {
            setFramework(fw.data)
            setReport(r.data.report)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [frameworkId])

    const downloadPDF = async () => {
        setDownloading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/reports/${frameworkId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit_report_${framework?.name?.replace(' ', '_')}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

    const r = report
    const scoreColor = r?.compliance_score >= 80 ? 'var(--green-400)' : r?.compliance_score >= 50 ? 'var(--yellow-400)' : 'var(--red-400)'

    return (
        <div className="page-container animate-fade">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button onClick={() => navigate(`/gaps/${frameworkId}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', padding: 0 }}>← Back to Gap Analysis</button>
                    <h1 className="page-title">Audit Report</h1>
                    <p className="page-subtitle">{framework?.name} · Generated {new Date().toLocaleDateString()}</p>
                </div>
                <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading}>
                    {downloading ? '⏳ Generating...' : '📄 Export PDF'}
                </button>
            </div>

            <div className="report-card">
                {/* Executive Summary */}
                <div className="report-section">
                    <div className="report-section-title">Executive Summary</div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        This audit report presents the compliance posture of the organization against the <strong style={{ color: 'var(--text-primary)' }}>{r?.framework}</strong> framework.
                        The overall compliance score is <strong style={{ color: scoreColor }}>{r?.compliance_score}%</strong>, indicating a status of{' '}
                        <strong style={{ color: scoreColor }}>{r?.audit_readiness}</strong>.
                        Out of {r?.total_controls} controls assessed, {r?.implemented} are fully implemented,
                        {r?.partial} are partially implemented, and {r?.not_implemented} have not been implemented.
                    </p>
                </div>

                {/* Score Summary */}
                <div className="report-section">
                    <div className="report-section-title">Compliance Score Summary</div>
                    <div className="report-metric-grid">
                        <div className="report-metric">
                            <div className="report-metric-val" style={{ color: scoreColor }}>{r?.compliance_score}%</div>
                            <div className="report-metric-lbl">Compliance Score</div>
                        </div>
                        <div className="report-metric">
                            <div className="report-metric-val">{r?.total_controls}</div>
                            <div className="report-metric-lbl">Total Controls</div>
                        </div>
                        <div className="report-metric">
                            <div className="report-metric-val" style={{ color: 'var(--green-400)' }}>{r?.implemented}</div>
                            <div className="report-metric-lbl">Implemented</div>
                        </div>
                        <div className="report-metric">
                            <div className="report-metric-val" style={{ color: 'var(--yellow-400)' }}>{r?.partial}</div>
                            <div className="report-metric-lbl">Partial</div>
                        </div>
                        <div className="report-metric">
                            <div className="report-metric-val" style={{ color: 'var(--red-400)' }}>{r?.not_implemented}</div>
                            <div className="report-metric-lbl">Not Implemented</div>
                        </div>
                        <div className="report-metric">
                            <div className="report-metric-val" style={{ color: 'var(--orange-400)' }}>{r?.high_risk_gaps}</div>
                            <div className="report-metric-lbl">High-Risk Gaps</div>
                        </div>
                    </div>
                </div>

                {/* Audit Readiness */}
                <div className="report-section">
                    <div className="report-section-title">Audit Readiness Indicator</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <div className="progress-bar" style={{ height: '10px', marginBottom: '0.5rem' }}>
                                <div className="progress-fill" style={{ width: `${r?.compliance_score}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>0%</span><span>50%</span><span>80%</span><span>100%</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '140px' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor }}>{r?.compliance_score}%</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r?.audit_readiness}</div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="report-section">
                    <div className="report-section-title">Key Recommendations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {r?.not_implemented > 0 && <div className="gap-remediation">🔴 <strong>Priority 1:</strong> Address {r.not_implemented} unimplemented controls, starting with critical controls first.</div>}
                        {r?.partial > 0 && <div className="gap-remediation">🟡 <strong>Priority 2:</strong> Complete {r.partial} partially implemented controls by assigning owners and setting due dates.</div>}
                        <div className="gap-remediation">🔵 <strong>Priority 3:</strong> Upload evidence documents for all implemented controls to demonstrate compliance.</div>
                        <div className="gap-remediation">📅 <strong>Ongoing:</strong> Schedule quarterly reviews to maintain compliance posture and address emerging threats.</div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', paddingTop: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/controls/${frameworkId}`)}>← Edit Controls</button>
                    <button className="btn btn-secondary" onClick={() => navigate(`/gaps/${frameworkId}`)}>View Gap Analysis</button>
                    <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading}>
                        {downloading ? '⏳ Generating...' : '📄 Download Full PDF Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}
