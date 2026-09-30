import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import MemberCard from './MemberCard'
import './SpecialtyView.css'

export default function SpecialtyView() {
  const { jobTypeId, specialtyId } = useParams()
  const { getJobType, getSpecialty, getMembersBySpecialty } = useNetwork()
  const jobType = getJobType(jobTypeId)
  const specialty = getSpecialty(jobTypeId, specialtyId)
  const members = getMembersBySpecialty(jobTypeId, specialtyId)

  if (!jobType || !specialty) return null

  return (
    <div className="specialty-view">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Directory</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/job-types/${jobTypeId}`}>{jobType.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{specialty.name}</span>
      </nav>

      <header className="specialty-view__header">
        <p className="specialty-view__type">{jobType.name}</p>
        <h1>{specialty.name}</h1>
        <p className="specialty-view__count">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </header>

      {members.length === 0 ? (
        <p className="empty-state">No members listed in this specialty yet.</p>
      ) : (
        <div className="member-grid">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
