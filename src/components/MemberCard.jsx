import { Link } from 'react-router-dom'
import { isNewMember } from '../data/network'
import useVibePointer from '../hooks/useVibePointer'
import VerifiedBadge from './VerifiedBadge'
import './MemberCard.css'
import './VerifiedBadge.css'

const availabilityColors = {
  Hiring: 'availability--hiring',
  Freelance: 'availability--freelance',
  Mentoring: 'availability--mentoring',
}

export default function MemberCard({ member, vibe = false }) {
  const vibeRef = useVibePointer()

  return (
    <Link
      ref={vibe ? vibeRef : undefined}
      to={`/members/${member.id}`}
      className={vibe ? 'member-card member-card--vibe' : 'member-card'}
    >
      {vibe && <span className="member-card__vibe" aria-hidden="true" />}
      <img
        className="member-card__photo"
        src={member.profilePhoto}
        alt=""
        loading="lazy"
      />
      <div className="member-card__body">
        <div className="member-card__top">
          <div>
            <div className="member-card__name-row">
              <h3>{member.name}</h3>
              {member.verified && !member.isBot && <VerifiedBadge compact />}
              {member.isBot && <span className="member-card__demo">Demo</span>}
              {isNewMember(member) && <span className="member-card__new">New</span>}
            </div>
            <p className="member-card__title">{member.jobTitle}</p>
          </div>
          {member.rating && (
            <div className="member-card__rating" aria-label={`Rated ${member.rating} out of 5`}>
              ★ {member.rating}
            </div>
          )}
        </div>
        <p className="member-card__specialty">{member.specialty}</p>
        <p className="member-card__meta">
          {member.company} · {member.location}
        </p>
        <div className="member-card__tags">
          {member.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="tag">{skill}</span>
          ))}
          {member.skills.length > 3 && (
            <span className="tag tag--more">+{member.skills.length - 3}</span>
          )}
        </div>
        <div className="member-card__availability">
          {member.availability.map((item) => (
            <span key={item} className={`availability ${availabilityColors[item] || ''}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
