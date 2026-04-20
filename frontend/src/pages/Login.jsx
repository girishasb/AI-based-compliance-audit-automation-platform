import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', form)
            localStorage.setItem('token', data.access_token)
            localStorage.setItem('user', JSON.stringify({ id: data.user_id, name: data.full_name, email: data.email, role: data.role }))
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check credentials.')
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
                    <h1 className="auth-title">ComplianceAI</h1>
                    <p className="auth-subtitle">AI-Powered Audit & Compliance Platform</p>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <form className="auth-form" onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" type="email" placeholder="you@company.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : '→ Sign In'}
                    </button>
                </form>
                <div className="auth-link">
                    Don't have an account? <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    )
}
