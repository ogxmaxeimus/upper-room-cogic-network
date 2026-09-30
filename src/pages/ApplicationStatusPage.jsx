import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { getApplicantApplicationId } from '../lib/applicantNotifications'
import './ApplicationStatusPage.css'

export default function ApplicationStatusPage() {
  const { applicationId } = useParams()
  const { getApplication } = useNetwork()
  const application = getApplication(applicationId)
  const savedId = getApplicantApplicationId()

  if (!application) {
    return (
      <div className="application-status">
        <div className="application-status__card">
          <h1>Application not found</h1>
          <p>
            We could not find an application with this ID on this device.
            If you submitted from another browser, use the status link from your confirmation email
            or contact the coordinator.
          </p>
          <Link to="/join" className="btn btn--primary">Apply to join</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="application-status">
      <div className="application-status__card">
        <h1>Application status</h1>
        <p className="application-status__name">{application.name}</p>
        <p className="application-status__meta">
          Submitted {new Date(application.submittedAt).toLocaleString()}
        </p>

        {application.status === 'pending' && (
          <div className="application-status__panel application-status__panel--pending" role="status">
            <h2>Under review</h2>
            <p>
              Your application is pending coordinator review. You will see an update here once a
              decision is made. Coordinators typically respond within a few business days.
            </p>
          </div>
        )}

        {application.status === 'approved' && (
          <div className="application-status__panel application-status__panel--approved" role="status">
            <h2>Approved</h2>
            <p>
              Congratulations! Your profile has been approved and published to the directory.
            </p>
            {application.createdMemberId && (
              <Link to={`/members/${application.createdMemberId}`} className="btn btn--primary">
                View your public profile
              </Link>
            )}
          </div>
        )}

        {application.status === 'rejected' && (
          <div className="application-status__panel application-status__panel--rejected" role="status">
            <h2>Not approved</h2>
            <p>
              Your application was reviewed and not approved at this time.
            </p>
            {application.rejectionReason && (
              <blockquote className="application-status__reason">
                <strong>Coordinator note:</strong> {application.rejectionReason}
              </blockquote>
            )}
            <p>
              You may reapply with updated information or contact the coordinator with questions.
            </p>
            <Link to="/join" className="btn btn--secondary">Submit a new application</Link>
          </div>
        )}

        {savedId === applicationId && application.status === 'pending' && (
          <p className="application-status__hint">
            Bookmark this page to check back for updates.
          </p>
        )}

        <p className="application-status__back">
          <Link to="/">← Back to directory</Link>
        </p>
      </div>
    </div>
  )
}
