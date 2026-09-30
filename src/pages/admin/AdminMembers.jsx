import { Link } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import './admin.css'

export default function AdminMembers() {
  const { getMembers, archiveMember, moveMemberToTop } = useNetwork()
  const members = getMembers()

  const handleArchive = (id, name) => {
    if (window.confirm(`Remove ${name} from the public directory?`)) {
      archiveMember(id)
    }
  }

  const handleMoveToTop = (id) => {
    moveMemberToTop(id)
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1>Members</h1>
          <p>Published profiles, ordered with newest approvals and pinned members first.</p>
        </div>
        <Link to="/admin/members/new" className="btn btn--primary">Add member manually</Link>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Title</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={member.id}>
                <td className="admin-table__rank">{index + 1}</td>
                <td>
                  <div className="admin-table__name-cell">
                    {member.profilePhoto && (
                      <img src={member.profilePhoto} alt="" className="admin-table__avatar" />
                    )}
                    {member.name}
                  </div>
                </td>
                <td>{member.jobTitle}</td>
                <td>{member.location}</td>
                <td>{member.yearsExperience ? `${member.yearsExperience} yrs` : '—'}</td>
                <td>{member.source || 'seed'}</td>
                <td className="admin-table__actions">
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => handleMoveToTop(member.id)}
                      title="Move to top of public lists"
                    >
                      Move to top
                    </button>
                  )}
                  <Link to={`/members/${member.id}`} className="btn btn--secondary">View</Link>
                  <Link to={`/admin/members/${member.id}/edit`} className="btn btn--secondary">Edit</Link>
                  <button type="button" className="btn btn--ghost" onClick={() => handleArchive(member.id, member.name)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
