import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { downloadVCard } from '../utils/vcard'
import useVibePointer from '../hooks/useVibePointer'
import VerifiedBadge from './VerifiedBadge'
import ContactRequestModal from './ContactRequestModal'
import MemberCard from './MemberCard'
import './MemberProfile.css'
import './VerifiedBadge.css'
import './ContactRequestModal.css'

const socialLabels = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  github: 'GitHub',
  website: 'Website',
}

export default function MemberProfile() {
  const { memberId } = useParams()
  const {
    getMember,
    getJobType,
    getSpecialty,
    getSimilarMembers,
    getMembersInCity,
    getCityGroups,
  } = useNetwork()
  const [showContact, setShowContact] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const vibeRef = useVibePointer({ persist: true })

  const member = getMember(memberId)
  if (!member) return null

  const jobType = getJobType(member.jobTypeId)
  const specialty = getSpecialty(member.jobTypeId, member.specialtyId)
  const similar = getSimilarMembers(member)
  const cityMates = getMembersInCity(member.location, member.id)
  const citySlug = getCityGroups().find((c) => c.location === member.location)?.slug

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${member.name} — Upper Room COGIC Network`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link copied!')
        setTimeout(() => setShareMessage(''), 2000)
      }
    } catch {
      /* user cancelled share */
    }
  }

  const primaryCta = member.availability.includes('Mentoring')
    ? 'Request mentorship'
    : member.availability.includes('Hiring')
      ? 'Hire / collaborate'
      : member.availability.includes('Freelance')
        ? 'Request project work'
        : 'Get in touch'

  const actionsDisabled = Boolean(member.actionsDisabled)

  return (
    <div ref={vibeRef} className="member-profile">
      <div className="member-profile__vibe" aria-hidden="true">
        <span className="member-profile__wash" />
        <span className="member-profile__spot" />
        <span className="member-profile__rays" />
        <span className="member-profile__orb member-profile__orb--gold" />
        <span className="member-profile__orb member-profile__orb--ember" />
        <span className="member-profile__orb member-profile__orb--cream" />
        <span className="member-profile__grain" />
      </div>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Directory</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/job-types/${member.jobTypeId}`}>{jobType?.name}</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/specialties/${member.jobTypeId}/${member.specialtyId}`}>{specialty?.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{member.name}</span>
      </nav>

      <article className="profile-card profile-card--vibe">
        <header className="profile-card__header">
          <div className="profile-card__vibe" aria-hidden="true">
            <span className="profile-card__spot" />
          </div>
          <div className="profile-card__photo-wrap">
            <img
              className="profile-card__photo"
              src={member.profilePhoto}
              alt={`Photo of ${member.name}`}
            />
          </div>
          <div className="profile-card__intro">
            <div className="profile-card__name-row">
              <h1>{member.name}</h1>
              {member.verified && !member.isBot && <VerifiedBadge />}
              {member.isBot && <span className="profile-card__demo">Demo</span>}
            </div>
            <p className="profile-card__title">{member.jobTitle}</p>
            <p className="profile-card__specialty">{member.specialty}</p>
            <p className="profile-card__company">
              {member.company} ·{' '}
              {citySlug ? (
                <Link to={`/cities/${citySlug}`}>{member.location}</Link>
              ) : (
                member.location
              )}
            </p>
            {member.affiliation && (
              <p className="profile-card__affiliation">{member.affiliation}</p>
            )}
            <div className="profile-card__availability">
              {member.availability.map((item) => (
                <span key={item} className="availability-badge">{item}</span>
              ))}
            </div>
            {member.rating && (
              <div className="profile-card__rating">
                <span className="profile-card__stars" aria-hidden="true">★★★★★</span>
                <strong>{member.rating}</strong>
                <span>({member.endorsements} endorsements)</span>
              </div>
            )}
            <div className="profile-card__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={actionsDisabled}
                onClick={() => setShowContact(true)}
              >
                {primaryCta}
              </button>
              {member.calendly && !actionsDisabled ? (
                <a
                  href={member.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary"
                >
                  Book a call
                </a>
              ) : actionsDisabled ? (
                <button type="button" className="btn btn--secondary" disabled>
                  Book a call
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn--secondary"
                disabled={actionsDisabled}
                onClick={handleShare}
              >
                {shareMessage || 'Share profile'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={actionsDisabled}
                onClick={() => downloadVCard(member)}
              >
                Download vCard
              </button>
            </div>
          </div>
        </header>

        <div className="profile-card__grid">
          <section>
            <h2>About</h2>
            <p>{member.bio}</p>
          </section>

          <aside className="profile-card__sidebar">
            <div className="info-block">
              <h3>Experience</h3>
              <p>{member.yearsExperience} years</p>
            </div>
            <div className="info-block">
              <h3>Category</h3>
              <p>
                <Link to={`/job-types/${member.jobTypeId}`}>{jobType?.name}</Link>
              </p>
              <p className="info-block__sub">
                <Link to={`/specialties/${member.jobTypeId}/${member.specialtyId}`}>
                  {specialty?.name}
                </Link>
              </p>
            </div>
            {member.calendly && (
              <div className="info-block">
                <h3>Schedule</h3>
                <a href={member.calendly} target="_blank" rel="noopener noreferrer">
                  Book on Calendly →
                </a>
              </div>
            )}
            {member.portfolio && (
              <div className="info-block">
                <h3>Portfolio</h3>
                <a href={member.portfolio} target="_blank" rel="noopener noreferrer">
                  View portfolio →
                </a>
              </div>
            )}
            {member.socialLinks && Object.keys(member.socialLinks).length > 0 && (
              <div className="info-block">
                <h3>Social Links</h3>
                <ul className="social-links">
                  {Object.entries(member.socialLinks).map(([key, url]) => (
                    <li key={key}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {socialLabels[key] || key}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <section className="profile-card__skills">
          <h2>Skills & Tags</h2>
          <div className="skill-tags">
            {member.skills.map((skill) => (
              <Link
                key={skill}
                to={`/search?q=${encodeURIComponent(skill)}`}
                className="skill-tag"
              >
                {skill}
              </Link>
            ))}
          </div>
        </section>

        {member.endorsementQuotes?.length > 0 && (
          <section className="profile-card__endorsements">
            <h2>Endorsements</h2>
            <div className="endorsement-list">
              {member.endorsementQuotes.map((quote, i) => (
                <blockquote key={i} className="endorsement">
                  <p>&ldquo;{quote.text}&rdquo;</p>
                  <footer>— {quote.author}</footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}
      </article>

      {cityMates.length > 0 && (
        <section className="similar-members">
          <div className="similar-members__header">
            <h2>Also in {member.location}</h2>
            {citySlug && (
              <Link to={`/cities/${citySlug}`} className="section__link">
                View all in {member.location.split(',')[0]} →
              </Link>
            )}
          </div>
          <div className="member-grid">
            {cityMates.map((m) => (
              <MemberCard key={m.id} member={m} vibe />
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="similar-members">
          <h2>Similar specialties</h2>
          <div className="member-grid">
            {similar.map((m) => (
              <MemberCard key={m.id} member={m} vibe />
            ))}
          </div>
        </section>
      )}

      {showContact && (
        <ContactRequestModal member={member} onClose={() => setShowContact(false)} />
      )}
    </div>
  )
}
