export const AVAILABILITY_OPTIONS = ['Hiring', 'Freelance', 'Mentoring']

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experience' },
  { value: 'name', label: 'Name (A–Z)' },
]

export function getUniqueLocations(members) {
  return [...new Set(members.map((m) => m.location))].sort()
}

export function searchMembers(members, {
  q = '',
  query = '',
  availability = '',
  location = '',
  jobTypeId = '',
  specialtyId = '',
  sort = 'relevance',
} = {}) {
  const needle = (q || query).trim().toLowerCase()

  let results = members.filter((member) => {
    if (availability && !member.availability.includes(availability)) return false
    if (location && member.location !== location) return false
    if (jobTypeId && member.jobTypeId !== jobTypeId) return false
    if (specialtyId && member.specialtyId !== specialtyId) return false

    if (!needle) return true

    const haystack = [
      member.name,
      member.jobTitle,
      member.specialty,
      member.company,
      member.location,
      member.bio,
      ...member.skills,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(needle)
  })

  if (needle) {
    results = results.map((member) => ({
      member,
      score: scoreMember(member, needle),
    }))
    results.sort((a, b) => b.score - a.score)
    results = results.map(({ member }) => member)
  } else {
    results = sortMembers(results, sort)
  }

  return results
}

function scoreMember(member, q) {
  let score = 0
  const name = member.name.toLowerCase()
  const title = member.jobTitle.toLowerCase()
  const specialty = member.specialty.toLowerCase()

  if (name.startsWith(q)) score += 100
  else if (name.includes(q)) score += 80

  if (title.includes(q)) score += 50
  if (specialty.includes(q)) score += 45
  if (member.skills.some((s) => s.toLowerCase().includes(q))) score += 30
  if (member.location.toLowerCase().includes(q)) score += 20
  if (member.company.toLowerCase().includes(q)) score += 15
  if (member.bio.toLowerCase().includes(q)) score += 10
  if (member.featured) score += 5
  if (member.verified) score += 3

  return score
}

function sortMembers(members, sort) {
  const sorted = [...members]
  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'experience':
      return sorted.sort((a, b) => b.yearsExperience - a.yearsExperience)
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
}

export function buildSearchParams(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return params.toString()
}

export function parseSearchParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    availability: searchParams.get('availability') || '',
    location: searchParams.get('location') || '',
    jobTypeId: searchParams.get('jobTypeId') || '',
    specialtyId: searchParams.get('specialtyId') || '',
    sort: searchParams.get('sort') || 'relevance',
  }
}

export function saveContactRequest(request) {
  import('../lib/store').then((store) => store.saveContactRequest(request))
}

export function saveJoinApplication(application) {
  import('../lib/store').then((store) => store.submitApplication(application))
}
