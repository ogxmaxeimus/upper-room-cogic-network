import { Link } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import './admin.css'

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminContacts() {
  const { getContactRequests } = useNetwork()
  const contacts = getContactRequests()

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Contact requests</h1>
        <p>Introduction and contact requests submitted through member profiles.</p>
      </header>

      {contacts.length === 0 ? (
        <p className="admin-empty">No contact requests yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>For member</th>
                <th>Type</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{formatWhen(c.submittedAt)}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="admin-table__sub">
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                      {c.phone ? ` · ${c.phone}` : ''}
                    </div>
                  </td>
                  <td>
                    {c.memberId ? (
                      <Link to={`/members/${c.memberId}`}>{c.memberName || c.memberId}</Link>
                    ) : (
                      c.memberName || '—'
                    )}
                  </td>
                  <td>{c.requestType || 'general'}</td>
                  <td className="admin-table__message">{c.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
