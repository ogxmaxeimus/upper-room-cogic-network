import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, logoutAdmin } from '../../lib/adminAuth'
import './admin.css'

export function AdminGuard({ children }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin/login" replace />
  return children
}

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>UR Admin</span>
          <small>Network coordinator</small>
        </div>
        <nav>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/applications">Applications</Link>
          <Link to="/admin/contacts">Contacts</Link>
          <Link to="/admin/members">Members</Link>
          <Link to="/admin/members/new">Add member</Link>
          <Link to="/" className="admin-sidebar__public">View public site →</Link>
        </nav>
        <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
