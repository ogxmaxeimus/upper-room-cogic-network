import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import { changeAdminPassword, PASSWORD_MIN_LENGTH } from '../../lib/adminAuth'
import { remoteChangePassword } from '../../lib/remoteStore'
import { hasFormspree } from '../../lib/notifyCoordinator'
import { COORDINATOR_EMAIL } from '../../data/site'
import './admin.css'

const COORDINATOR_EMAIL_CONFIGURED = Boolean(import.meta.env.VITE_COORDINATOR_EMAIL)

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function incompleteReasons(member) {
  const reasons = []
  if (!member.bio?.trim()) reasons.push('missing bio')
  if (!member.location?.trim() || member.location === 'Location TBD') {
    reasons.push('location incomplete')
  }
  // Emails are often private on seed profiles; only flag for application/manual sources.
  if (
    (member.source === 'application' || member.source === 'manual') &&
    !member.email?.trim()
  ) {
    reasons.push('missing email')
  }
  return reasons
}

function buildRecentActivity({ applications, contacts, members }) {
  const events = []

  for (const app of applications) {
    if (app.submittedAt) {
      events.push({
        id: `app-submit-${app.id}`,
        at: app.submittedAt,
        label: `${app.name} submitted an application`,
        href: `/admin/applications/${app.id}`,
      })
    }
    if (app.reviewedAt && (app.status === 'approved' || app.status === 'rejected')) {
      events.push({
        id: `app-review-${app.id}`,
        at: app.reviewedAt,
        label:
          app.status === 'approved'
            ? `${app.name} was approved`
            : `${app.name} was declined`,
        href: `/admin/applications/${app.id}`,
      })
    }
  }

  for (const c of contacts) {
    if (!c.submittedAt) continue
    events.push({
      id: `contact-${c.id}`,
      at: c.submittedAt,
      label: `${c.name} requested an introduction${c.memberName ? ` with ${c.memberName}` : ''}`,
      href: '/admin/contacts',
    })
  }

  for (const m of members) {
    if (!m.joinedAt || m.source === 'seed') continue
    const at = m.joinedAt.length <= 10 ? `${m.joinedAt}T12:00:00.000Z` : m.joinedAt
    events.push({
      id: `member-join-${m.id}`,
      at,
      label: `${m.name} joined the directory`,
      href: `/admin/members/${m.id}/edit`,
    })
  }

  return events
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5)
}

export default function AdminDashboard() {
  const { getApplications, getMembers, getContactRequests, storageMode, resetLocalCache } = useNetwork()
  const pending = getApplications('pending')
  const allApplications = getApplications()
  const members = getMembers()
  const contacts = getContactRequests()
  const isRemote = storageMode === 'remote'
  const formspreeConfigured = hasFormspree()

  const incompleteMembers = useMemo(
    () =>
      members
        .map((m) => ({ member: m, reasons: incompleteReasons(m) }))
        .filter(({ reasons }) => reasons.length > 0)
        .slice(0, 8),
    [members],
  )

  const recentActivity = useMemo(
    () => buildRecentActivity({ applications: allApplications, contacts, members }),
    [allApplications, contacts, members],
  )

  const needsAttention = useMemo(() => {
    const items = []
    for (const app of pending) {
      items.push({
        id: `pending-app-${app.id}`,
        kind: 'application',
        title: app.name,
        detail: app.jobTitle || 'Application pending review',
        href: `/admin/applications/${app.id}`,
        cta: 'Review',
      })
    }
    for (const c of contacts) {
      items.push({
        id: `contact-${c.id}`,
        kind: 'contact',
        title: c.name,
        detail: `Introduction request${c.memberName ? ` for ${c.memberName}` : ''}`,
        href: '/admin/contacts',
        cta: 'Open',
      })
    }
    for (const { member, reasons } of incompleteMembers) {
      items.push({
        id: `incomplete-${member.id}`,
        kind: 'profile',
        title: member.name,
        detail: `Incomplete profile · ${reasons.join(', ')}`,
        href: `/admin/members/${member.id}/edit`,
        cta: 'Edit',
      })
    }
    return items
  }, [pending, contacts, incompleteMembers])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSubmitting(true)
    try {
      const result = await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
        remoteChange: storageMode === 'remote' ? remoteChangePassword : undefined,
      })
      if (!result.ok) {
        setPasswordError(result.error)
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(
        storageMode === 'remote'
          ? 'Password updated. It works on this browser and for shared Admin access.'
          : 'Password updated for this browser. Deployed Admin still uses the server password until you change it there or set Netlify env vars.',
      )
    } catch (err) {
      setPasswordError(err.message || 'Could not change password.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const approveNextHref = pending[0]
    ? `/admin/applications/${pending[0].id}`
    : '/admin/applications'

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Dashboard</h1>
        <p>Review applications, manage members, and publish profiles.</p>
      </header>

      <div
        className={`admin-status-banner ${isRemote ? 'admin-status-banner--remote' : 'admin-status-banner--local'}`}
        role="status"
      >
        <div>
          <strong>{isRemote ? 'Shared across devices (Netlify)' : 'Data is only on this device'}</strong>
          <p>
            {isRemote
              ? 'Applications, members, and contact requests sync through the deployed site so you can manage them from any browser.'
              : 'Local development stores applications, members, and contact requests in this browser only. Deploying with Netlify Functions unlocks shared storage across devices.'}
          </p>
        </div>
        <span className="admin-status-banner__tag">{isRemote ? 'Shared' : 'Local'}</span>
      </div>

      <div
        className={`admin-notify-status ${formspreeConfigured ? 'admin-notify-status--ok' : 'admin-notify-status--warn'}`}
      >
        <strong>Email notifications: {formspreeConfigured ? 'Configured' : 'Not configured'}</strong>
        <p>
          {formspreeConfigured
            ? 'Formspree is set, so new applications and introduction requests can email the coordinator automatically.'
            : 'Formspree is not set (VITE_FORMSPREE_ENDPOINT). Submissions still save locally, but email uses a mailto draft fallback.'}
          {' '}
          Coordinator email: <code>{COORDINATOR_EMAIL}</code>
          {COORDINATOR_EMAIL_CONFIGURED ? ' (from env).' : ' (default — set VITE_COORDINATOR_EMAIL to customize).'}
        </p>
      </div>

      <div className="admin-stats">
        <Link to="/admin/applications" className="admin-stat admin-stat--link">
          <strong>{pending.length}</strong>
          <span>Pending applications</span>
        </Link>
        <Link to="/admin/members" className="admin-stat admin-stat--link">
          <strong>{members.length}</strong>
          <span>Published members</span>
        </Link>
        <Link to="/admin/contacts" className="admin-stat admin-stat--link">
          <strong>{contacts.length}</strong>
          <span>Contact requests</span>
        </Link>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Quick actions</h2>
        </div>
        <div className="admin-quick-actions">
          <Link to={approveNextHref} className="btn btn--primary">
            {pending.length > 0 ? 'Approve next application' : 'Review applications'}
          </Link>
          <Link to="/admin/members/new" className="btn btn--secondary">
            Add member
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              if (window.confirm('Clear this browser’s network cache and reload?')) {
                resetLocalCache()
              }
            }}
          >
            Reset local cache
          </button>
          <a href="#change-password" className="btn btn--ghost">
            Change password
          </a>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Needs attention</h2>
          {needsAttention.length > 0 && (
            <span className="admin-attention-count">{needsAttention.length}</span>
          )}
        </div>
        {needsAttention.length === 0 ? (
          <p className="admin-empty">Nothing waiting — applications, contacts, and profiles look clear.</p>
        ) : (
          <ul className="admin-list">
            {needsAttention.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    <span className={`admin-kind admin-kind--${item.kind}`}>{item.kind}</span>
                    {' '}
                    {item.detail}
                  </span>
                </div>
                <Link to={item.href} className="btn btn--secondary">
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Recent activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="admin-empty">No recent events yet. Activity appears as people apply, get approved, or request introductions.</p>
        ) : (
          <ul className="admin-activity">
            {recentActivity.map((event) => (
              <li key={event.id}>
                <Link to={event.href}>{event.label}</Link>
                <time dateTime={event.at}>{formatWhen(event.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel" id="change-password">
        <div className="admin-panel__header">
          <h2>Change password</h2>
        </div>
        <p className="admin-empty" style={{ marginBottom: '1rem' }}>
          Update the coordinator admin password. Enter your current password, then a new one
          (at least {PASSWORD_MIN_LENGTH} characters, with letters plus a number or symbol).
        </p>
        <form className="admin-password-form" onSubmit={handleChangePassword}>
          {passwordError && (
            <p className="form-error" role="alert">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="form-success" role="status">{passwordSuccess}</p>
          )}
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={passwordSubmitting}
          >
            {passwordSubmitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
