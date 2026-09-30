import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import {
  searchMembers,
  parseSearchParams,
  AVAILABILITY_OPTIONS,
  SORT_OPTIONS,
  getUniqueLocations,
} from '../utils/search'
import MemberCard from '../components/MemberCard'
import './SearchPage.css'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { getMembers, jobTypes, getAllSpecialties } = useNetwork()
  const members = getMembers()
  const filters = parseSearchParams(searchParams)
  const locations = useMemo(() => getUniqueLocations(members), [members])
  const specialties = getAllSpecialties()
  const [query, setQuery] = useState(filters.q)

  useEffect(() => {
    setQuery(filters.q)
  }, [filters.q])

  const results = useMemo(
    () => searchMembers(members, filters),
    [members, filters.q, filters.availability, filters.location, filters.jobTypeId, filters.specialtyId, filters.sort],
  )

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'jobTypeId') next.delete('specialtyId')
    setSearchParams(next)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateFilter('q', query.trim())
  }

  const clearFilters = () => {
    setQuery('')
    setSearchParams({})
  }

  const hasActiveFilters = filters.q || filters.availability || filters.location || filters.jobTypeId || filters.specialtyId

  return (
    <div className="search-page">
      <header className="search-page__header">
        <h1>Search the network</h1>
        <p>Find members by name, skill, specialty, location, or availability.</p>
        <form className="search-page__query" onSubmit={handleSearchSubmit} role="search">
          <label htmlFor="search-page-q" className="sr-only">Search keywords</label>
          <input
            id="search-page-q"
            type="search"
            placeholder="Search by name, skill, title, or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">Search</button>
        </form>
      </header>

      <div className="search-page__layout">
        <aside className="search-filters" aria-label="Search filters">
          <div className="search-filters__header">
            <h2>Filters</h2>
            {hasActiveFilters && (
              <button type="button" className="search-filters__clear" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          <label>
            Availability
            <select
              value={filters.availability}
              onChange={(e) => updateFilter('availability', e.target.value)}
            >
              <option value="">Any</option>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

          <label>
            Location
            <select
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
            >
              <option value="">Any location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </label>

          <label>
            Job type
            <select
              value={filters.jobTypeId}
              onChange={(e) => updateFilter('jobTypeId', e.target.value)}
            >
              <option value="">Any job type</option>
              {jobTypes.map((jt) => (
                <option key={jt.id} value={jt.id}>{jt.name}</option>
              ))}
            </select>
          </label>

          <label>
            Specialty
            <select
              value={filters.specialtyId}
              onChange={(e) => updateFilter('specialtyId', e.target.value)}
              disabled={!filters.jobTypeId}
            >
              <option value="">Any specialty</option>
              {specialties
                .filter((s) => !filters.jobTypeId || s.jobTypeId === filters.jobTypeId)
                .map((s) => (
                  <option key={`${s.jobTypeId}-${s.id}`} value={s.id}>{s.name}</option>
                ))}
            </select>
          </label>

          <label>
            Sort by
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </aside>

        <section className="search-results">
          <p className="search-results__count">
            {results.length} member{results.length !== 1 ? 's' : ''} found
            {filters.q && <> for &ldquo;{filters.q}&rdquo;</>}
          </p>

          {results.length === 0 ? (
            <div className="search-results__empty">
              <p>No members match your search.</p>
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                Clear filters
              </button>
              <p className="search-results__empty-hint">
                Know someone who should be listed?{' '}
                <Link to="/join">Join the network →</Link>
              </p>
            </div>
          ) : (
            <div className="member-grid">
              {results.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
