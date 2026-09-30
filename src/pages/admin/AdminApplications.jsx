import { Link } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import './admin.css'

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function AdminApplications() {
  const { getApplications } = useNetwork()
  const applications = getApplications()

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Applications</h1>
        <p>Review join requests and approve or reject them.</p>
      </header>

      {applications.length === 0 ? (
        <p className="admin-empty">No applications yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.name}</td>
                  <td>{app.jobTitle}</td>
                  <td>{app.location || '—'}</td>
                  <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${app.status}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/applications/${app.id}`} className="btn btn--secondary">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
