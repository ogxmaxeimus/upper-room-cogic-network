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
  const sentence = clean.match(/^[^.!?]+[.!?]/)
  const text = sentence ? sentence[0] : clean
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}.`
}

function DefaultCard({ member, initials, background }) {
  return (
    <article
      className="relative flex h-full flex-col justify-between overflow-hidden p-6 text-[#0c2748]"
      style={{ background }}
    >
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-black/50">
        {member.specialty || member.jobTitle}
      </span>
      <div
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center text-[9rem] font-semibold tracking-[-0.08em] text-black/[0.06]"
      >
        {initials}
      </div>
      <div className="relative">
        <h3 className="text-3xl font-medium tracking-[-0.05em]">{member.name}</h3>
        <p className="mt-1 text-sm text-black/55">{member.jobTitle}</p>
      </div>
    </article>
  )
}

function HoverCard({ member, background, color }) {
  return (
    <article
      className="flex h-full flex-col justify-between p-6"
      style={{ background, color }}
    >
      <p className="max-w-[24ch] text-xl font-medium leading-tight tracking-[-0.035em]">
        {excerpt(member.bio)}
      </p>
      <div>
        <p className="font-semibold">{member.name}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] opacity-55">
          {member.jobTitle}
        </p>
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
        className="aspect-[4/5] w-full max-w-sm rounded-3xl"
      />
    </Link>
  )
}
