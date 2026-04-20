import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const CATEGORIES = ['All', 'Administrative', 'Technical', 'Physical']

function StatusBadge({ status }) {
    const cls = status === 'Implemented' ? 'status-implemented' : status === 'Partial' ? 'status-partial' : 'status-not-impl'
    const dot = status === 'Implemented' ? '●' : status === 'Partial' ? '◑' : '○'
    return <span className={`status-badge ${cls}`}>{dot} {status}</span>
}

export default function Controls() {
    const { frameworkId } = useParams()
    const navigate = useNavigate()
    const [controls, setControls] = useState([])
    const [framework, setFramework] = useState(null)
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('All')
    const [saving, setSaving] = useState({})
    const [score, setScore] = useState(null)
    const [editingCtrl, setEditingCtrl] = useState(null)
    const [evidenceFile, setEvidenceFile] = useState(null)

    const load = useCallback(() => {
        Promise.all([
            api.get(`/frameworks/${frameworkId}`),
            api.get(`/controls/${frameworkId}`),
            api.get(`/compliance/score/${frameworkId}`)
        ]).then(([fw, ctrl, sc]) => {
            setFramework(fw.data)
            setControls(ctrl.data)
            setScore(sc.data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [frameworkId])

    useEffect(() => { load() }, [load])

    const updateStatus = async (controlId, newStatus, current) => {
        setSaving(s => ({ ...s, [controlId]: true }))
        try {
            await api.put(`/controls/${controlId}/status`, {
                status: newStatus,
                owner: current.owner,
                due_date: current.due_date,
                notes: current.notes
            })
            setControls(prev => prev.map(c => c.id === controlId ? { ...c, status: newStatus } : c))
            const sc = await api.get(`/compliance/score/${frameworkId}`)
            setScore(sc.data)
        } finally {
            setSaving(s => ({ ...s, [controlId]: false }))
        }
    }

    const handleSaveEdit = async () => {
        setSaving(s => ({ ...s, [editingCtrl.id]: true }))
        try {
            await api.put(`/controls/${editingCtrl.id}/status`, {
                status: editingCtrl.status || 'Not Implemented',
                owner: editingCtrl.owner || '',
                due_date: editingCtrl.due_date || '',
                notes: editingCtrl.notes || ''
            })

            let evCount = editingCtrl.evidence_count
            if (evidenceFile) {
                const formData = new FormData()
                formData.append('file', evidenceFile)
                await api.post(`/controls/${editingCtrl.id}/evidence`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                evCount = (evCount || 0) + 1
            }

            setControls(prev => prev.map(c => c.id === editingCtrl.id ? { ...editingCtrl, evidence_count: evCount } : c))
            const sc = await api.get(`/compliance/score/${frameworkId}`)
            setScore(sc.data)
            setEditingCtrl(null)
            setEvidenceFile(null)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(s => ({ ...s, [editingCtrl.id]: false }))
        }
    }

    if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

    const filtered = category === 'All' ? controls : controls.filter(c => c.category === category)
    const implemented = controls.filter(c => c.status === 'Implemented').length
    const partial = controls.filter(c => c.status === 'Partial').length

    return (
        <div className="page-container animate-fade">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button onClick={() => navigate('/frameworks')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem', padding: 0 }}>← Back to Frameworks</button>
                    <h1 className="page-title">{framework?.name} Controls</h1>
                    <p className="page-subtitle">{framework?.version} · {controls.length} total controls</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/gaps/${frameworkId}`)}>AI Gap Analysis</button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/reports/${frameworkId}`)}>Generate Report</button>
                </div>
            </div>

            {/* Score Bar */}
            {score && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compliance Score</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: score.compliance_score >= 80 ? 'var(--green-400)' : score.compliance_score >= 50 ? 'var(--yellow-400)' : 'var(--red-400)' }}>{score.compliance_score}%</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill" style={{ width: `${score.compliance_score}%` }} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span>✅ {implemented} Implemented</span>
                        <span>◑ {partial} Partial</span>
                        <span>○ {controls.length - implemented - partial} Pending</span>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="controls-filter">
                {CATEGORIES.map(cat => (
                    <button key={cat} className={`filter-btn ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} controls</span>
            </div>

            {/* Table */}
            <div className="controls-table-wrap">
                <table className="controls-table">
                    <thead>
                        <tr>
                            <th>Control ID</th>
                            <th>Control Name</th>
                            <th>Category</th>
                            <th>Critical</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th>Due Date</th>
                            <th>Evidence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(ctrl => (
                            <tr key={ctrl.id}>
                                <td><span className="ctrl-id">{ctrl.control_id}</span></td>
                                <td style={{ maxWidth: '280px' }}>
                                    <div style={{ fontWeight: 500 }}>{ctrl.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ctrl.description?.slice(0, 60)}...</div>
                                </td>
                                <td><span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ctrl.category}</span></td>
                                <td>{ctrl.is_critical && <span className="critical-badge">⚠ Critical</span>}</td>
                                <td>
                                    <select className="status-select" value={ctrl.status}
                                        disabled={saving[ctrl.id]}
                                        onChange={e => updateStatus(ctrl.id, e.target.value, ctrl)}>
                                        <option>Not Implemented</option>
                                        <option>Partial</option>
                                        <option>Implemented</option>
                                    </select>
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ctrl.owner || '—'}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ctrl.due_date || '—'}</td>
                                <td><span className="evidence-count">📎 {ctrl.evidence_count}</span></td>
                                <td>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingCtrl({ ...ctrl })} disabled={saving[ctrl.id]}>
                                        ✏️ Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingCtrl && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Control {editingCtrl.control_id}</h2>
                            <button onClick={() => { setEditingCtrl(null); setEvidenceFile(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</label>
                                    <select className="status-select" style={{ width: '100%', padding: '0.5rem' }} value={editingCtrl.status} onChange={e => setEditingCtrl(c => ({ ...c, status: e.target.value }))}>
                                        <option value="Not Implemented">Not Implemented</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Implemented">Implemented</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Due Date</label>
                                    <input type="date" style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} value={editingCtrl.due_date || ''} onChange={e => setEditingCtrl(c => ({ ...c, due_date: e.target.value }))} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Control Owner</label>
                                <input type="text" placeholder="e.g. John Doe, IT Dept" style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} value={editingCtrl.owner || ''} onChange={e => setEditingCtrl(c => ({ ...c, owner: e.target.value }))} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notes / Remediation Plan</label>
                                <textarea placeholder="Add context or remediation steps..." style={{ width: '100%', padding: '0.5rem', minHeight: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} value={editingCtrl.notes || ''} onChange={e => setEditingCtrl(c => ({ ...c, notes: e.target.value }))} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload Evidence Document</label>
                                <div style={{ border: '1px dashed var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <input type="file" id="evidence-upload" style={{ display: 'none' }} onChange={e => setEvidenceFile(e.target.files[0])} />
                                    <label htmlFor="evidence-upload" style={{ cursor: 'pointer', color: 'var(--blue-400)', fontSize: '0.9rem', display: 'block', width: '100%' }}>
                                        {evidenceFile ? evidenceFile.name : '📄 Click to select evidence file'}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => { setEditingCtrl(null); setEvidenceFile(null); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving[editingCtrl.id]}>
                                {saving[editingCtrl.id] ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
