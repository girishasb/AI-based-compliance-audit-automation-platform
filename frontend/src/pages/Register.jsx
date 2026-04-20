import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Register() {
    const [form, setForm] = useState({ full_name: '', email: '', password: '', org_name: '', role: 'analyst' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', form)
            localStorage.setItem('token', data.access_token)
            localStorage.setItem('user', JSON.stringify({ id: data.user_id, name: data.full_name, email: data.email, role: data.role }))
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-orb auth-bg-orb-1" />
            <div className="auth-bg-orb auth-bg-orb-2" />
            <div className="auth-card animate-fade">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🛡️</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Start your compliance journey today</p>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <form className="auth-form" onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" type="text" placeholder="John Smith"
                            value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Work Email</label>
                        <input className="form-input" type="email" placeholder="you@company.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Minimum 8 characters"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <input className="form-input" type="text" placeholder="Acme Corp"
                            value={form.org_name} onChange={e => setForm({ ...form, org_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Your Role</label>
                        <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="analyst">Security Analyst</option>
                            <option value="auditor">Auditor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : '→ Create Account'}
                    </button>
                </form>
                <div className="auth-link">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
