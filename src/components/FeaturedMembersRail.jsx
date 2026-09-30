import { useEffect, useMemo, useRef } from 'react'
import FeaturedMemberCard, { FEATURED_TRANSITIONS } from './FeaturedMemberCard'
import './FeaturedMembersRail.css'

export default function FeaturedMembersRail({ members }) {
  const trackRef = useRef(null)

  const cards = useMemo(
    () =>
      members.slice(0, FEATURED_TRANSITIONS.length).map((member, index) => ({
        member,
        transition: FEATURED_TRANSITIONS[index],
      })),
    [members],
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      track.scrollLeft += event.deltaY
    }

    track.addEventListener('wheel', onWheel, { passive: false })
    return () => track.removeEventListener('wheel', onWheel)
  }, [])

  const scrollByCard = (direction) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.featured-member')
    const amount = (card?.getBoundingClientRect().width || 320) + 20
    track.scrollTo({
      left: track.scrollLeft + direction * amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="featured-rail">
      <div className="featured-rail__toolbar">
        <button
          type="button"
          className="featured-rail__nav"
          aria-label="Scroll featured members left"
          onClick={() => scrollByCard(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="featured-rail__nav"
          aria-label="Scroll featured members right"
          onClick={() => scrollByCard(1)}
        >
          ›
        </button>
      </div>

      <div
        ref={trackRef}
        className="featured-rail__track"
        tabIndex={0}
        aria-label="Featured members. Scroll left and right."
      >
        {cards.map(({ member, transition }) => (
          <FeaturedMemberCard
            key={`${member.id}-${transition.effect}`}
            member={member}
            transition={transition}
          />
        ))}
      </div>
    </div>
  )
}
