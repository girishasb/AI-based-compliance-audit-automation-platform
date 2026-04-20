import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Cell, PieChart, Pie, Legend
} from 'recharts'
import api from '../api/client'

const COLORS = ['#22c55e', '#facc15', '#ef4444']

function ScoreRing({ score }) {
    const r = 70, c = 2 * Math.PI * r
    const dash = (score / 100) * c
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#facc15' : '#ef4444'
    const readiness = score >= 80 ? 'Audit Ready' : score >= 50 ? 'Needs Improvement' : 'Critical'
    const cls = score >= 80 ? 'readiness-ready' : score >= 50 ? 'readiness-improve' : 'readiness-critical'
    return (
        <div className="score-ring-wrap">
            <div className="score-ring">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                    <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
                        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                </svg>
                <div className="score-ring-text">
                    <span className="score-number" style={{ color }}>{score}%</span>
                    <span className="score-label">Compliance</span>
                </div>
            </div>
            <span className={`score-readiness ${cls}`}>{readiness}</span>
        </div>
    )
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        // Auto-seed demo data for new users (backend ignores if already seeded)
        api.post('/compliance/seed-demo')
            .catch(() => { }) // ignore errors silently
            .finally(() => {
                api.get('/compliance/dashboard')
                    .then(r => { setData(r.data); setLoading(false) })
                    .catch(() => setLoading(false))
            })
    }, [])

    if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

    const frameworks = data?.frameworks || []
    const totalControls = frameworks.reduce((s, f) => s + f.total_controls, 0)
    const totalImpl = frameworks.reduce((s, f) => s + f.implemented, 0)
    const avgScore = frameworks.length ? Math.round(frameworks.reduce((s, f) => s + f.compliance_score, 0) / frameworks.length) : 0
    const pieData = [
        { name: 'Implemented', value: totalImpl },
        { name: 'Remaining', value: totalControls - totalImpl },
    ]

    return (
        <div className="page-container animate-fade">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Compliance Dashboard</h1>
                    <p className="page-subtitle">Overview of your compliance posture across all frameworks</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/frameworks')}>+ Select Framework</button>
            </div>

            {/* KPI Row */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                        <svg fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div><div className="kpi-label">Avg Compliance</div><div className="kpi-number">{avgScore}%</div></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
                        <svg fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                    <div><div className="kpi-label">Implemented</div><div className="kpi-number" style={{ color: 'var(--green-400)' }}>{totalImpl}</div></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(250,204,21,0.15)' }}>
                        <svg fill="none" stroke="#facc15" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div><div className="kpi-label">Pending</div><div className="kpi-number" style={{ color: 'var(--yellow-400)' }}>{totalControls - totalImpl}</div></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <svg fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div><div className="kpi-label">Frameworks</div><div className="kpi-number" style={{ color: 'var(--purple-400)' }}>{frameworks.length}</div></div>
                </div>
            </div>

            {/* Score + Pie */}
            <div className="score-section">
                <ScoreRing score={avgScore} />
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Overall Audit Readiness</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '420px' }}>
                        Your platform tracks compliance controls across 4 major frameworks. Keep implementing controls to improve your audit posture.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {frameworks.map(fw => (
                            <div key={fw.framework_id} style={{ minWidth: '130px' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{fw.framework_name}</div>
                                <div className="progress-bar" style={{ marginBottom: '0.2rem' }}><div className="progress-fill" style={{ width: `${fw.compliance_score}%` }} /></div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--blue-400)' }}>{fw.compliance_score}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="chart-grid">
                <div className="chart-card">
                    <div className="chart-title">Compliance Score by Framework</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={frameworks} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="framework_name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: '#0d1530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9' }} />
                            <Bar dataKey="compliance_score" radius={[6, 6, 0, 0]} fill="url(#barGrad)">
                                {frameworks.map((_, i) => <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e'][i % 4]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Total Controls Status</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                <Cell fill="#22c55e" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0d1530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
