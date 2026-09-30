import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useNetwork } from '../context/NetworkContext'
import SearchBar from './SearchBar'
import MemberCard from './MemberCard'
import FeaturedMembersRail from './FeaturedMembersRail'
import './Home.css'

export default function Home() {
  const {
    jobTypes,
    getAllSpecialties,
    getMembers,
    getMembersBySpecialty,
    getFeaturedMembers,
    getNewMembers,
    getCityGroups,
  } = useNetwork()

  const specialties = getAllSpecialties()
  const members = getMembers()
  const [showAllSpecialties, setShowAllSpecialties] = useState(false)

  const rankedSpecialties = useMemo(() => {
    return specialties
      .map((specialty) => ({
        ...specialty,
        memberCount: getMembersBySpecialty(specialty.jobTypeId, specialty.id).length,
      }))
      .sort((a, b) => b.memberCount - a.memberCount || a.name.localeCompare(b.name))
  }, [specialties, members, getMembersBySpecialty])

  const SPECIALTY_PREVIEW_COUNT = 14
  const visibleSpecialties = showAllSpecialties
    ? rankedSpecialties
    : rankedSpecialties.slice(0, SPECIALTY_PREVIEW_COUNT)
  const hasMoreSpecialties = rankedSpecialties.length > SPECIALTY_PREVIEW_COUNT

  const featured = getFeaturedMembers()
  const featuredRail = useMemo(() => {
    const seen = new Set(featured.map((member) => member.id))
    const extra = members.filter((member) => !seen.has(member.id))
    return [...featured, ...extra].slice(0, 8)
  }, [featured, members])
  const newMembers = getNewMembers()
  const cities = getCityGroups().slice(0, 8)
  const memberCount = members.length

  return (
    <div className="home">
      <section className="hero">
        <Logo size="home" tone="on-light" linkToHome={false} showSubtitle={false} className="hero__logo" />
        <p className="hero__eyebrow">Faith · Community · Excellence</p>
        <h1>Discover Professionals in the Upper Room</h1>
        <p className="hero__lead">
          Search, browse, and connect with trusted members offering their skills,
          services, and mentorship across our community. More professionals will be
          added after leadership walkthrough.
        </p>
        <div className="hero__search">
          <SearchBar />
        </div>
        <div className="hero__stats">
          <div><strong>{jobTypes.length}</strong><span>Job Types</span></div>
          <div><strong>{specialties.length}</strong><span>Specialties</span></div>
          <div><strong>{memberCount}</strong><span>Members</span></div>
        </div>
      </section>

      <section className="section section--featured">
        <div className="section__header">
          <h2>Featured Members</h2>
          <p>Hover a card for a different transition. Scroll the row left and right to see all eight.</p>
        </div>
        <FeaturedMembersRail members={featuredRail} />
      </section>

      {newMembers.length > 0 && (
        <section className="section section--muted">
          <div className="section__header">
            <h2>New members</h2>
            <p>Recently welcomed professionals joining the network.</p>
          </div>
          <div className="member-grid">
            {newMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__header section__header--row">
          <div>
            <h2>Browse by city</h2>
            <p>The globe points to each state. Open a state to see its cities and members.</p>
          </div>
          <Link to="/cities" className="section__link">Open the network globe →</Link>
        </div>
        <div className="city-grid city-grid--compact">
          {cities.map((city) => (
            <Link key={city.slug} to={`/cities/${city.slug}`} className="city-chip">
              <span className="city-chip__name">{city.location}</span>
              <span className="city-chip__count">{city.count} members</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--muted">
        <div className="section__header">
          <h2>Job Types</h2>
          <p>Explore broad career fields represented in our network.</p>
        </div>
        <div className="card-grid">
          {jobTypes.map((jobType) => (
            <Link
              key={jobType.id}
              to={`/job-types/${jobType.id}`}
              className="category-card"
            >
              <span className="category-card__icon" aria-hidden="true">{jobType.icon}</span>
              <h3>{jobType.name}</h3>
              <p>{jobType.description}</p>
              <span className="category-card__meta">
                {jobType.specialties.length} specialties →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Specialty Categories</h2>
          <p>Jump directly to a specific profession or skill area.</p>
        </div>
        <div className="specialty-list">
          {visibleSpecialties.map((specialty) => (
            <Link
              key={`${specialty.jobTypeId}-${specialty.id}`}
              to={`/specialties/${specialty.jobTypeId}/${specialty.id}`}
              className="specialty-chip"
            >
              <span className="specialty-chip__name">{specialty.name}</span>
              <span className="specialty-chip__type">{specialty.jobTypeName}</span>
            </Link>
          ))}
        </div>
        {hasMoreSpecialties && (
          <div className="specialty-list__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowAllSpecialties((open) => !open)}
            >
              {showAllSpecialties
                ? 'Show fewer categories'
                : `Show all ${rankedSpecialties.length} categories`}
            </button>
          </div>
        )}
      </section>

      <section className="cta-banner">
        <div>
          <h2>Are you a professional in our community?</h2>
          <p>Join the network and share your gifts with fellow believers.</p>
        </div>
        <Link to="/join" className="btn btn--primary">Apply to join</Link>
      </section>
    </div>
  )
}
