import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './SearchBar.css'

export default function SearchBar({ compact = false }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    navigate(`/search${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <form
      className={`search-bar${compact ? ' search-bar--compact' : ''}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <label htmlFor="network-search" className="sr-only">Search members</label>
      <input
        id="network-search"
        type="search"
        placeholder="Search by name, skill, title, or location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  )
}
