import { Link } from 'react-router-dom'
import { HoverTransition } from '@/components/ui/hover-transition'
import './FeaturedMemberCard.css'

export const FEATURED_TRANSITIONS = [
  { effect: 'wipe', direction: 'right', duration: 0.72, defaultBg: '#ece9e1', hoverBg: '#1a5398', hoverText: '#f7f4ee' },
  { effect: 'ripple', direction: 'center', duration: 0.9, defaultBg: '#e8e4db', hoverBg: '#c4a35a', hoverText: '#0c2748' },
  { effect: 'parallax', direction: 'left', duration: 0.78, defaultBg: '#ece9e1', hoverBg: '#0c2748', hoverText: '#f4f1ea' },
  { effect: 'curtain', direction: 'top', duration: 0.82, defaultBg: '#e3ddd2', hoverBg: '#6b2c3e', hoverText: '#f7f4ee' },
  { effect: 'diagonal', direction: 'top-right', duration: 0.88, defaultBg: '#ece9e1', hoverBg: '#1f4a3c', hoverText: '#f4f1ea' },
  { effect: 'morph', direction: 'bottom', duration: 0.76, defaultBg: '#e7e2d8', hoverBg: '#8e6a32', hoverText: '#f7f4ee' },
  { effect: 'strips', direction: 'right', duration: 0.84, defaultBg: '#ece9e1', hoverBg: '#3a4f6c', hoverText: '#f4f1ea' },
  { effect: 'slide', direction: 'bottom-left', duration: 0.7, defaultBg: '#ddd8ce', hoverBg: '#e6dcc8', hoverText: '#0c2748' },
]

function getInitials(name) {
  const skip = new Set(['sr', 'jr', 'ii', 'iii', 'iv', 'bishop', 'dr', 'rev'])
  const parts = name
    .replace(/[“”"']/g, '')
    .split(/\s+/)
    .filter((part) => {
      const clean = part.replace(/\./g, '').toLowerCase()
      return clean && !skip.has(clean) && !/^[a-z]\.$/i.test(part)
    })
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function excerpt(bio, max = 148) {
  if (!bio) return 'Open this profile to learn more about their work in the network.'
  const clean = bio.replace(/[—–]/g, ', ').replace(/\s+/g, ' ').trim()
  const protectedStops = /\b(?:[A-Z]|Sr|Jr|Mr|Mrs|Ms|Dr|St|vs)\./g
  const placeholders = []
  const masked = clean.replace(protectedStops, (match) => {
    placeholders.push(match)
    return `\0${placeholders.length - 1}\0`
  })
  const sentence = masked.match(/^[^.!?]+[.!?]/)
  const restored = (sentence ? sentence[0] : masked).replace(
    /\0(\d+)\0/g,
    (_, index) => placeholders[Number(index)],
  )
  if (restored.length <= max) return restored
  return `${restored.slice(0, max).replace(/\s+\S*$/, '')}.`
}

function hideBrokenPhoto(event) {
  event.currentTarget.style.display = 'none'
  event.currentTarget.closest('.featured-member__face')?.classList.add('featured-member__face--fallback')
}

function DefaultCard({ member, initials, background }) {
  const photo = member.profilePhoto?.trim()

  return (
    <article
      className={`featured-member__face${photo ? '' : ' featured-member__face--fallback'}`}
      style={{ background }}
    >
      <span className="featured-member__initials" aria-hidden="true">
        {initials}
      </span>
      {photo ? (
        <img
          className="featured-member__photo"
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onError={hideBrokenPhoto}
        />
      ) : null}
    </article>
  )
}

function HoverCard({ member, background, color }) {
  return (
    <article
      className="featured-member__hover"
      style={{ background, color }}
    >
      <div>
        <span className="featured-member__hover-kicker">
          {member.specialty || member.jobTitle}
        </span>
        <p className="featured-member__hover-summary">{excerpt(member.bio)}</p>
      </div>
      <div>
        <p className="featured-member__hover-name">{member.name}</p>
        <p className="featured-member__hover-title">{member.jobTitle}</p>
      </div>
    </article>
  )
}

export default function FeaturedMemberCard({ member, transition }) {
  const initials = getInitials(member.name)
  const {
    effect,
    direction,
    duration,
    defaultBg,
    hoverBg,
    hoverText,
  } = transition

  return (
    <Link
      to={`/members/${member.id}`}
      className="featured-member"
    >
      <HoverTransition
        effect={effect}
        direction={direction}
        duration={duration}
        tabIndex={-1}
        label={`${member.name}, ${member.jobTitle}. ${effect} transition.`}
        defaultComponent={
          <DefaultCard member={member} initials={initials} background={defaultBg} />
        }
        hoverComponent={
          <HoverCard member={member} background={hoverBg} color={hoverText} />
        }
        className="featured-member__transition aspect-[4/5] w-full max-w-sm rounded-3xl"
      />
    </Link>
  )
}
