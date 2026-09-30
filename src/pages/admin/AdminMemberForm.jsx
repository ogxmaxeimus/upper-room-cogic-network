import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useNetwork } from '../../context/NetworkContext'
import ProfilePhotoUpload from '../../components/ProfilePhotoUpload'
import { applicationToMember } from '../../lib/store'
import './admin.css'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  jobTypeId: '',
  specialtyId: '',
  specialty: '',
  location: '',
  company: '',
  yearsExperience: 0,
  bio: '',
  portfolio: '',
  calendly: '',
  profilePhoto: '',
  availability: [],
  skills: '',
  verified: true,
  featured: false,
  pinToTop: true,
  pinOnSave: false,
  affiliation: 'Upper Room COGIC',
}

function memberToForm(member) {
  return {
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    jobTitle: member.jobTitle || '',
    jobTypeId: member.jobTypeId || '',
    specialtyId: member.specialtyId || '',
    specialty: member.specialty || '',
    location: member.location || '',
    company: member.company || '',
    yearsExperience: member.yearsExperience || 0,
    bio: member.bio || '',
    portfolio: member.portfolio || '',
    calendly: member.calendly || '',
    profilePhoto: member.profilePhoto || '',
    availability: member.availability || [],
    skills: (member.skills || []).join(', '),
    verified: member.verified !== false,
    featured: Boolean(member.featured),
    pinToTop: true,
    pinOnSave: false,
    affiliation: member.affiliation || 'Upper Room COGIC',
  }
}

function formToMember(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    jobTitle: form.jobTitle.trim(),
    jobTypeId: form.jobTypeId,
    specialtyId: form.specialtyId,
    specialty: form.specialty.trim() || form.jobTitle.trim(),
    location: form.location.trim(),
    company: form.company.trim(),
    yearsExperience: Number(form.yearsExperience) || 0,
    bio: form.bio.trim(),
    portfolio: form.portfolio.trim() || null,
    calendly: form.calendly.trim() || null,
    profilePhoto: form.profilePhoto.trim() || undefined,
    availability: form.availability,
    skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    verified: form.verified,
    featured: form.featured,
    affiliation: form.affiliation.trim(),
  }
}

export default function AdminMemberForm() {
  const { memberId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    getMember,
    getApplication,
    getSpecialty,
    jobTypes,
    getAllSpecialties,
    createMemberManual,
    updateMember,
    approveApplication,
    moveMemberToTop,
  } = useNetwork()

  const isEdit = Boolean(memberId)
  const applicationId = searchParams.get('application')
  const application = applicationId ? getApplication(applicationId) : null
  const existing = isEdit ? getMember(memberId) : null
  const specialties = getAllSpecialties()

  const initial = useMemo(() => {
    if (existing) return memberToForm(existing)
    if (application) {
      const specialty = application.specialtyId
        ? getSpecialty(application.jobTypeId, application.specialtyId)
        : null
      return memberToForm(applicationToMember(application, specialty?.name))
    }
    return { ...emptyForm }
  }, [existing, application, getSpecialty])

  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      if (name === 'availability') {
        setForm((prev) => ({
          ...prev,
          availability: checked
            ? [...prev.availability, value]
            : prev.availability.filter((a) => a !== value),
        }))
      } else {
        setForm((prev) => ({ ...prev, [name]: checked }))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.jobTitle.trim() || !form.jobTypeId) {
      setError('Name, job title, and job type are required.')
      return
    }

    const payload = formToMember(form)

    if (isEdit) {
      updateMember(memberId, payload)
      if (form.pinOnSave) {
        moveMemberToTop(memberId)
      }
      navigate('/admin/members')
      return
    }

    if (application?.status === 'pending') {
      approveApplication(application.id, payload.specialty, payload, { pinToTop: form.pinToTop })
      navigate('/admin/members')
      return
    }

    createMemberManual(payload)
    navigate('/admin/members')
  }

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link to="/admin/members">Members</Link>
        <span>/</span>
        <span>{isEdit ? 'Edit' : 'Add'}</span>
      </nav>

      <header className="admin-page__header">
        <h1>{isEdit ? `Edit ${existing?.name}` : 'Add member manually'}</h1>
        <p>{application ? 'Review and publish this application with any edits.' : 'Create a profile directly on the public directory.'}</p>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}

        <fieldset>
          <legend>Basic info</legend>
          <label>Name *<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={handleChange} /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={handleChange} /></label>
          <label>Affiliation<input name="affiliation" value={form.affiliation} onChange={handleChange} /></label>
          <label>Location<input name="location" value={form.location} onChange={handleChange} /></label>
          <ProfilePhotoUpload
            value={form.profilePhoto}
            onChange={(profilePhoto) => setForm((prev) => ({ ...prev, profilePhoto }))}
          />
        </fieldset>

        <fieldset>
          <legend>Professional</legend>
          <label>Job title *<input name="jobTitle" value={form.jobTitle} onChange={handleChange} required /></label>
          <label>Company<input name="company" value={form.company} onChange={handleChange} /></label>
          <label>Years of experience<input name="yearsExperience" type="number" min="0" value={form.yearsExperience} onChange={handleChange} /></label>
          <label>Job type *
            <select name="jobTypeId" value={form.jobTypeId} onChange={handleChange} required>
              <option value="">Select</option>
              {jobTypes.map((jt) => <option key={jt.id} value={jt.id}>{jt.name}</option>)}
            </select>
          </label>
          <label>Specialty category
            <select name="specialtyId" value={form.specialtyId} onChange={handleChange} disabled={!form.jobTypeId}>
              <option value="">Select</option>
              {specialties.filter((s) => s.jobTypeId === form.jobTypeId).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>Specialty label<input name="specialty" value={form.specialty} onChange={handleChange} placeholder="e.g. Product Designer" /></label>
          <label>Skills (comma-separated)<input name="skills" value={form.skills} onChange={handleChange} /></label>
          <label>Bio<textarea name="bio" rows={4} value={form.bio} onChange={handleChange} /></label>
        </fieldset>

        <fieldset>
          <legend>Links & availability</legend>
          <label>Portfolio<input name="portfolio" type="url" value={form.portfolio} onChange={handleChange} /></label>
          <label>Calendly<input name="calendly" type="url" value={form.calendly} onChange={handleChange} /></label>
          <div className="checkbox-group">
            {['Hiring', 'Freelance', 'Mentoring'].map((opt) => (
              <label key={opt} className="checkbox-label">
                <input type="checkbox" name="availability" value={opt} checked={form.availability.includes(opt)} onChange={handleChange} />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Visibility</legend>
          <label className="checkbox-label">
            <input type="checkbox" name="verified" checked={form.verified} onChange={handleChange} />
            Verified member
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
            Featured on home page
          </label>
          {application?.status === 'pending' && (
            <label className="checkbox-label">
              <input type="checkbox" name="pinToTop" checked={form.pinToTop} onChange={handleChange} />
              Show at top of member lists when published
            </label>
          )}
          {isEdit && (
            <label className="checkbox-label">
              <input type="checkbox" name="pinOnSave" checked={form.pinOnSave} onChange={handleChange} />
              Move to top of member lists when saving
            </label>
          )}
        </fieldset>

        <div className="admin-form__actions">
          <Link to="/admin/members" className="btn btn--ghost">Cancel</Link>
          <button type="submit" className="btn btn--primary">
            {isEdit ? 'Save changes' : 'Publish member'}
          </button>
        </div>
      </form>
    </div>
  )
}
