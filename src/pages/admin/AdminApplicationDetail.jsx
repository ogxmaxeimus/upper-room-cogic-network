import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import {
  applicationStatusPath,
  buildApprovalMailto,
  buildRejectionMailto,
} from '../../lib/applicantNotifications'
import './admin.css'

export default function AdminApplicationDetail() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const { getApplication, getSpecialty, approveApplication, rejectApplication } = useNetwork()
  const application = getApplication(applicationId)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [pinToTop, setPinToTop] = useState(true)
  const [message, setMessage] = useState('')
  const [notifyLink, setNotifyLink] = useState('')

  if (!application) {
    return (
      <div className="admin-page">
        <p className="admin-empty">Application not found.</p>
        <Link to="/admin/applications">← Back to applications</Link>
      </div>
    )
  }

  const specialty = application.specialtyId
    ? getSpecialty(application.jobTypeId, application.specialtyId)
    : null

  const statusUrl = `${window.location.origin}${applicationStatusPath(application.id)}`

  const handleApprove = () => {
    const member = approveApplication(application.id, specialty?.name, {}, { pinToTop })
    if (member) {
      const profileUrl = `${window.location.origin}/members/${member.id}`
      setMessage(`Approved! ${member.name} is now live on the site.`)
      setNotifyLink(buildApprovalMailto(application, profileUrl))
      setTimeout(() => navigate(`/admin/members/${member.id}/edit`), 2500)
    }
  }

  const handleReject = () => {
    rejectApplication(application.id, rejectReason)
    setMessage('Application rejected.')
    setNotifyLink(buildRejectionMailto(application, rejectReason))
    setTimeout(() => navigate('/admin/applications'), 2500)
  }

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link to="/admin/applications">Applications</Link>
        <span>/</span>
        <span>{application.name}</span>
      </nav>

      <header className="admin-page__header">
        <h1>{application.name}</h1>
        <p>{application.jobTitle}</p>
        <span className={`admin-badge admin-badge--${application.status}`}>{application.status}</span>
      </header>

      {message && <p className="admin-success">{message}</p>}

      {notifyLink && (
        <div className="admin-notify">
          <p><strong>Notify applicant</strong> — opens a pre-filled email to {application.email}</p>
          <a href={notifyLink} className="btn btn--secondary">Send notification email</a>
          <p className="admin-notify__hint">
            Applicant status page: <a href={statusUrl} target="_blank" rel="noreferrer">{statusUrl}</a>
          </p>
        </div>
      )}

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <h2>Application details</h2>
          <dl className="admin-dl">
            <dt>Email</dt><dd>{application.email}</dd>
            <dt>Phone</dt><dd>{application.phone || '—'}</dd>
            <dt>Location</dt><dd>{application.location || '—'}</dd>
            <dt>Company</dt><dd>{application.company || '—'}</dd>
            <dt>Experience</dt><dd>{application.yearsExperience ? `${application.yearsExperience} years` : '—'}</dd>
            <dt>Skills</dt><dd>{application.skills?.join(', ') || '—'}</dd>
            <dt>Availability</dt><dd>{application.availability?.join(', ') || '—'}</dd>
            <dt>Portfolio</dt><dd>{application.portfolio ? <a href={application.portfolio} target="_blank" rel="noreferrer">Link</a> : '—'}</dd>
            <dt>Calendly</dt><dd>{application.calendly ? <a href={application.calendly} target="_blank" rel="noreferrer">Link</a> : '—'}</dd>
            <dt>Status page</dt>
            <dd>
              <a href={statusUrl} target="_blank" rel="noreferrer">View applicant status link</a>
            </dd>
            <dt>Submitted</dt><dd>{new Date(application.submittedAt).toLocaleString()}</dd>
          </dl>
          {application.profilePhoto && (
            <>
              <h3>Profile photo</h3>
              <img src={application.profilePhoto} alt="" className="admin-app-photo" />
            </>
          )}
          {application.bio && (
            <>
              <h3>Bio</h3>
              <p>{application.bio}</p>
            </>
          )}
          {application.socialLinks && Object.keys(application.socialLinks).length > 0 && (
            <>
              <h3>Social links</h3>
              <ul className="admin-link-list">
                {Object.entries(application.socialLinks).map(([key, url]) => (
                  <li key={key}>
                    <a href={url} target="_blank" rel="noreferrer">{key}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {application.status === 'pending' && (
          <aside className="admin-panel admin-panel--actions">
            <h2>Decision</h2>
            <p>Approving will automatically create a published member profile on the public site.</p>
            <label className="checkbox-label admin-pin-option">
              <input
                type="checkbox"
                checked={pinToTop}
                onChange={(e) => setPinToTop(e.target.checked)}
              />
              Show at top of member lists
            </label>
            <button type="button" className="btn btn--primary btn--full" onClick={handleApprove}>
              Approve & publish
            </button>
            <button type="button" className="btn btn--secondary btn--full" onClick={() => setShowReject(!showReject)}>
              Reject application
            </button>
            {showReject && (
              <div className="admin-reject">
                <label>
                  Reason (optional — shown to applicant on status page)
                  <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                </label>
                <button type="button" className="btn btn--primary btn--full" onClick={handleReject}>
                  Confirm reject
                </button>
              </div>
            )}
            <Link to={`/admin/members/new?application=${application.id}`} className="btn btn--secondary btn--full">
              Approve with edits…
            </Link>
          </aside>
        )}

        {application.status === 'approved' && application.createdMemberId && (
          <aside className="admin-panel">
            <h2>Published profile</h2>
            <Link to={`/members/${application.createdMemberId}`} className="btn btn--secondary">
              View public profile
            </Link>
            <Link to={`/admin/members/${application.createdMemberId}/edit`} className="btn btn--secondary">
              Edit member
            </Link>
            <a
              href={buildApprovalMailto(application, `${window.location.origin}/members/${application.createdMemberId}`)}
              className="btn btn--secondary"
            >
              Send approval email
            </a>
          </aside>
        )}

        {application.status === 'rejected' && (
          <aside className="admin-panel">
            <h2>Applicant notification</h2>
            <a
              href={buildRejectionMailto(application, application.rejectionReason || '')}
              className="btn btn--secondary"
            >
              Send rejection email
            </a>
          </aside>
        )}
      </div>
    </div>
  )
}
