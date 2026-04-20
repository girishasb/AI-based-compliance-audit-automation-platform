import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Frameworks from './pages/Frameworks'
import Controls from './pages/Controls'
import GapAnalysis from './pages/GapAnalysis'
import Reports from './pages/Reports'

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" replace />
}

function Sidebar() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

    const logout = () => { localStorage.clear(); navigate('/login') }

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">🛡️ ComplianceAI</div>
                <div className="sidebar-logo-sub">Audit Automation Platform</div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-title">Main</div>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                    Dashboard
                </NavLink>
                <NavLink to="/frameworks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Frameworks
                </NavLink>

                <div className="nav-section-title">Analysis</div>
                <div className="nav-item" onClick={() => navigate('/frameworks')} style={{ cursor: 'pointer' }}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Controls
                </div>
                <div className="nav-item" onClick={() => navigate('/frameworks')} style={{ cursor: 'pointer' }}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Gap Analysis
                </div>

                <div className="nav-section-title">Reports</div>
                <div className="nav-item" onClick={() => navigate('/frameworks')} style={{ cursor: 'pointer' }}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Audit Reports
                </div>
            </nav>

            <div className="sidebar-user">
                <div className="sidebar-user-card">
                    <div className="user-avatar">{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
                        <div className="user-role">{user.role || 'analyst'}</div>
                    </div>
                    <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

function AppShell({ children }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">{children}</div>
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route path="/dashboard" element={
                    <PrivateRoute><AppShell><Dashboard /></AppShell></PrivateRoute>
                } />
                <Route path="/frameworks" element={
                    <PrivateRoute><AppShell><Frameworks /></AppShell></PrivateRoute>
                } />
                <Route path="/controls/:frameworkId" element={
                    <PrivateRoute><AppShell><Controls /></AppShell></PrivateRoute>
                } />
                <Route path="/gaps/:frameworkId" element={
                    <PrivateRoute><AppShell><GapAnalysis /></AppShell></PrivateRoute>
                } />
                <Route path="/reports/:frameworkId" element={
                    <PrivateRoute><AppShell><Reports /></AppShell></PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}
