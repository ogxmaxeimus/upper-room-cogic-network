import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import MemberCard from './MemberCard'
import './JobTypeView.css'

export default function JobTypeView() {
  const { jobTypeId } = useParams()
  const { getJobType, getMembersByJobType } = useNetwork()
  const jobType = getJobType(jobTypeId)
  const members = getMembersByJobType(jobTypeId)

  if (!jobType) return null

  return (
    <div className="job-type-view">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Directory</Link>
        <span aria-hidden="true">/</span>
        <span>{jobType.name}</span>
      </nav>

      <header className="job-type-view__header">
        <span className="job-type-view__icon" aria-hidden="true">{jobType.icon}</span>
        <div>
          <h1>{jobType.name}</h1>
          <p>{jobType.description}</p>
        </div>
      </header>

      <section className="subsection">
        <h2>Specialties in this field</h2>
        <div className="specialty-links">
          {jobType.specialties.map((specialty) => (
            <Link
              key={specialty.id}
              to={`/specialties/${jobTypeId}/${specialty.id}`}
              className="specialty-link"
            >
              {specialty.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="subsection">
        <h2>All members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="empty-state">No members listed in this category yet.</p>
        ) : (
          <div className="member-grid">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
