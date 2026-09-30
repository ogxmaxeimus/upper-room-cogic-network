import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import MemberCard from '../components/MemberCard'
import './CityView.css'

export default function CityView() {
  const { citySlug } = useParams()
  const { getCityBySlug } = useNetwork()
  const city = getCityBySlug(citySlug)

  if (!city) return null

  return (
    <div className="city-view">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Directory</Link>
        <span aria-hidden="true">/</span>
        <Link to="/cities">Cities</Link>
        <span aria-hidden="true">/</span>
        <span>{city.location}</span>
      </nav>

      <header className="city-view__header">
        <h1>{city.location}</h1>
        <p>{city.count} network member{city.count !== 1 ? 's' : ''} in this area</p>
      </header>

      <div className="member-grid">
        {city.members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
