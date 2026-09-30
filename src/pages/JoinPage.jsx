import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import ProfilePhotoUpload from '../components/ProfilePhotoUpload'
import {
  applicationStatusPath,
  saveApplicantApplicationId,
} from '../lib/applicantNotifications'
import { hasFormspree, notifyCoordinatorOfApplication } from '../lib/notifyCoordinator'
import './JoinPage.css'

const emptySocial = { linkedin: '', github: '', website: '' }

export default function JoinPage() {
  const { jobTypes, getAllSpecialties, submitApplication } = useNetwork()
  const specialties = getAllSpecialties()
  const [submitted, setSubmitted] = useState(null)
  const [notifyInfo, setNotifyInfo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    jobTitle: '',
    jobTypeId: '',
    location: '',
    bio: '',
    profilePhoto: '',
    phone: '',
    specialtyId: '',
    company: '',
    yearsExperience: '',
    skills: '',
    availability: [],
    portfolio: '',
    calendly: '',
    socialLinks: { ...emptySocial },
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        availability: checked
          ? [...prev.availability, value]
          : prev.availability.filter((a) => a !== value),
      }))
    } else if (name.startsWith('social_')) {
      const key = name.replace('social_', '')
      setForm((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.jobTitle.trim() || !form.jobTypeId || !form.location.trim()) {
      setError('Please complete all required fields.')
      return
    }

    setBusy(true)
    setError('')

    const socialLinks = Object.fromEntries(
      Object.entries(form.socialLinks).filter(([, url]) => url.trim()),
    )

    const application = submitApplication({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      jobTypeId: form.jobTypeId,
      specialtyId: form.specialtyId,
      location: form.location.trim(),
      company: form.company.trim(),
      yearsExperience: Number(form.yearsExperience) || 0,
      profilePhoto: form.profilePhoto,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      availability: form.availability,
      bio: form.bio.trim(),
      portfolio: form.portfolio.trim(),
      calendly: form.calendly.trim(),
      socialLinks,
    })

    saveApplicantApplicationId(application.id)

    const notify = await notifyCoordinatorOfApplication(application)
    setNotifyInfo(notify)
    if (notify.channel === 'mailto' && notify.href) {
      // Honest fallback when Formspree is not configured
      window.location.href = notify.href
    }

    setSubmitted(application)
    setBusy(false)
  }

  if (submitted) {
    const statusPath = applicationStatusPath(submitted.id)
    const emailed = notifyInfo?.channel === 'formspree'
    return (
      <div className="join-page">
        <div className="join-success">
          <h1>Application received</h1>
          <p>
            Thank you for applying to join the Upper Room COGIC Professional Network.
            {emailed
              ? ' A coordinator has been notified by email and will review your profile within a few business days.'
              : ' Your application is saved for coordinator review. If an email draft opened, please send it so the coordinator is notified.'}
          </p>
          <div className="join-success__status">
            <p><strong>Track your application</strong></p>
            <p>Bookmark this page to check for approval updates:</p>
            <Link to={statusPath} className="btn btn--secondary">
              View application status
            </Link>
          </div>
          <Link to="/" className="btn btn--primary">Back to directory</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="join-page">
      <header className="join-page__header">
        <h1>Join the network</h1>
        <p>
          Share a few essentials so the community can find you.
          Profiles are reviewed before being published. More members will be added after leadership walkthrough.
        </p>
      </header>

      <form className="join-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}

        <fieldset>
          <legend>Essentials</legend>
          <label>
            Full name *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email *
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Job title *
            <input name="jobTitle" placeholder="e.g. Licensed Therapist" value={form.jobTitle} onChange={handleChange} required />
          </label>
          <label>
            Job type *
            <select name="jobTypeId" value={form.jobTypeId} onChange={handleChange} required>
              <option value="">Select a job type</option>
              {jobTypes.map((jt) => (
                <option key={jt.id} value={jt.id}>{jt.name}</option>
              ))}
            </select>
          </label>
          <label>
            Location *
            <input name="location" placeholder="Raleigh, NC" value={form.location} onChange={handleChange} required />
            <span className="optional">Use City, ST. The globe places you by state, then lists your city.</span>
          </label>
          <label>
            Short bio
            <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="A few sentences about your work and how you hope to serve…" />
          </label>
          <ProfilePhotoUpload
            value={form.profilePhoto}
            onChange={(profilePhoto) => setForm((prev) => ({ ...prev, profilePhoto }))}
          />
        </fieldset>

        <div className="join-optional">
          <button
            type="button"
            className="join-optional__toggle"
            onClick={() => setShowOptional((v) => !v)}
            aria-expanded={showOptional}
          >
            {showOptional ? 'Hide optional details' : 'Add optional details'}
          </button>

          {showOptional && (
            <fieldset>
              <legend>Optional</legend>
              <p className="join-optional__hint">
                Portfolio, social links, and scheduling can also be added by a coordinator after approval.
              </p>
              <label>
                Phone
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} />
              </label>
              <label>
                Specialty
                <select
                  name="specialtyId"
                  value={form.specialtyId}
                  onChange={handleChange}
                  disabled={!form.jobTypeId}
                >
                  <option value="">Select a specialty</option>
                  {specialties
                    .filter((s) => s.jobTypeId === form.jobTypeId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </label>
              <label>
                Company / organization
                <input name="company" value={form.company} onChange={handleChange} />
              </label>
              <label>
                Years of experience
                <input name="yearsExperience" type="number" min="0" max="60" value={form.yearsExperience} onChange={handleChange} />
              </label>
              <label>
                Skills <span className="optional">(comma-separated)</span>
                <input name="skills" placeholder="e.g. React, Counseling" value={form.skills} onChange={handleChange} />
              </label>
              <label>
                Portfolio or website
                <input name="portfolio" type="url" placeholder="https://" value={form.portfolio} onChange={handleChange} />
              </label>
              <label>
                Calendly
                <input name="calendly" type="url" placeholder="https://calendly.com/…" value={form.calendly} onChange={handleChange} />
              </label>
              <label>
                LinkedIn
                <input name="social_linkedin" type="url" value={form.socialLinks.linkedin} onChange={handleChange} />
              </label>
              <label>
                GitHub
                <input name="social_github" type="url" value={form.socialLinks.github} onChange={handleChange} />
              </label>
              <label>
                Website
                <input name="social_website" type="url" value={form.socialLinks.website} onChange={handleChange} />
              </label>
              <div className="checkbox-group">
                {['Hiring', 'Freelance', 'Mentoring'].map((opt) => (
                  <label key={opt} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={form.availability.includes(opt)}
                      onChange={handleChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <p className="join-form__privacy">
          By submitting, you agree to our <Link to="/privacy">Privacy Policy</Link>.
          {!hasFormspree() && (
            <> A notification email draft may open so the coordinator can be reached.</>
          )}
        </p>

        <button type="submit" className="btn btn--primary btn--full" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  )
}
