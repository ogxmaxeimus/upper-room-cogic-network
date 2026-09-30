import { parseLocation } from './usStates.js'
import { demoBots } from './demoBots.js'

export const jobTypes = [
  {
    id: 'creative-design',
    name: 'Creative & Design',
    description: 'Visual storytellers, brand builders, and experience designers.',
    icon: '✦',
    specialties: [
      { id: 'product-design', name: 'Product Design' },
      { id: 'graphic-design', name: 'Graphic Design' },
      { id: 'ux-research', name: 'UX Research' },
      { id: 'interior-design', name: 'Interior Design' },
    ],
  },
  {
    id: 'healthcare-wellness',
    name: 'Healthcare & Wellness',
    description: 'Care providers, therapists, and wellness professionals.',
    icon: '♡',
    specialties: [
      { id: 'therapy', name: 'Therapy & Counseling' },
      { id: 'nursing', name: 'Nursing' },
      { id: 'nutrition', name: 'Nutrition & Wellness' },
      { id: 'physical-therapy', name: 'Physical Therapy' },
    ],
  },
  {
    id: 'legal-finance',
    name: 'Legal & Finance',
    description: 'Attorneys, accountants, advisors, and compliance experts.',
    icon: '§',
    specialties: [
      { id: 'attorney', name: 'Attorney' },
      { id: 'accounting', name: 'Accounting' },
      { id: 'financial-planning', name: 'Financial Planning' },
      { id: 'real-estate-law', name: 'Real Estate Law' },
    ],
  },
  {
    id: 'business-entrepreneurship',
    name: 'Business & Entrepreneurship',
    description: 'Founders, operators, consultants, and growth leaders.',
    icon: '◈',
    specialties: [
      { id: 'consulting', name: 'Business Consulting' },
      { id: 'marketing', name: 'Marketing & Strategy' },
      { id: 'operations', name: 'Operations' },
      { id: 'hr', name: 'Human Resources' },
    ],
  },
  {
    id: 'ministry-education',
    name: 'Ministry & Education',
    description: 'Pastors, educators, chaplains, and community leaders.',
    icon: '✝',
    specialties: [
      { id: 'pastoral', name: 'Pastoral Ministry' },
      { id: 'worship', name: 'Worship & Music Ministry' },
      { id: 'teaching', name: 'Teaching & Instruction' },
      { id: 'youth-ministry', name: 'Youth Ministry' },
    ],
  },
  {
    id: 'technology-engineering',
    name: 'Technology & Engineering',
    description: 'Developers, engineers, analysts, and IT professionals.',
    icon: '⬡',
    specialties: [
      { id: 'software-engineering', name: 'Software Engineering' },
      { id: 'data-science', name: 'Data Science' },
      { id: 'cybersecurity', name: 'Cybersecurity' },
      { id: 'civil-engineering', name: 'Civil Engineering' },
    ],
  },
  {
    id: 'trades-services',
    name: 'Trades & Services',
    description: 'Skilled tradespeople and service professionals.',
    icon: '⚒',
    specialties: [
      { id: 'electrical', name: 'Electrical' },
      { id: 'plumbing', name: 'Plumbing' },
      { id: 'hvac', name: 'HVAC' },
      { id: 'automotive', name: 'Automotive' },
    ],
  },
  {
    id: 'arts-media',
    name: 'Arts & Media',
    description: 'Writers, producers, photographers, and performers.',
    icon: '◎',
    specialties: [
      { id: 'photography', name: 'Photography' },
      { id: 'videography', name: 'Videography' },
      { id: 'writing', name: 'Writing & Editing' },
      { id: 'music-production', name: 'Music Production' },
    ],
  },
]

/**
 * Seed directory.
 * Founding profiles are confirmed Upper Room members.
 * Demo bots are fictional — they only exist so the globe can be tested
 * across multiple cities and states.
 */
const foundingMembers = [
  {
    id: 'bishop-patrick-l-wooden-sr',
    name: 'Bishop Patrick L. Wooden Sr.',
    profilePhoto: '/images/bishop-patrick-l-wooden-sr.jpg',
    jobTitle: 'Bishop & Senior Pastor',
    jobTypeId: 'ministry-education',
    specialtyId: 'pastoral',
    specialty: 'Pastoral Ministry',
    skills: ['Gospel Preaching', 'Biblical Teaching', 'Pastoral Leadership', 'Community Advocacy', 'Discipleship'],
    yearsExperience: 38,
    company: 'Upper Room COGIC',
    location: 'Raleigh, NC',
    bio: 'Bishop Patrick L. Wooden Sr. is a soul-stirring gospel preacher and an influential voice for God who courageously speaks about the moral and social issues of our day. He concerns himself with delivering a word that is biblically relevant and life changing without focusing upon what is popular or politically correct. Bishop Wooden has been the pastor of Upper Room for over 38 years and leads with love, compassion, strength and sincerity. He takes seriously his responsibility as a “watchman on the wall,” keeping the congregants informed so that they will not be deceived. He often says, “I love you enough to tell you the truth.” He is also a significant voice in the community, known as a voice for the voiceless.',
    portfolio: 'https://upperroomgospel.org',
    availability: [],
    socialLinks: {
      website: 'https://upperroomgospel.org',
    },
    rating: null,
    endorsements: 0,
  },
  {
    id: 'clarence-rocky-raeford',
    name: 'Clarence "Rocky" Raeford',
    profilePhoto: 'https://ui-avatars.com/api/?name=Rocky+Raeford&background=003366&color=c9a227&size=400&bold=true',
    jobTitle: 'Minister of Music',
    jobTypeId: 'arts-media',
    specialtyId: 'music-production',
    specialty: 'Gospel Music & Education',
    skills: ['Gospel Organ', 'Piano', 'Music Production', 'Music Education', 'Performance'],
    yearsExperience: 20,
    company: 'Upper Room COGIC',
    location: 'Raleigh, NC',
    bio: 'Clarence “Rocky” Raeford is a highly respected musician, gospel organist, and music educator based in the Raleigh-Durham area. He serves on the piano and music production faculty at the Community Music School in Raleigh and is the Minister of Music at the Upper Room Church of God in Christ. Known for his incredible versatility and deep roots in traditional and contemporary gospel, Raeford is highly sought after as both a performer and an instructor. He has also been recognized for his work helping young students discover their passion for music composition.',
    portfolio: 'https://upperroomgospel.org',
    availability: ['Freelance', 'Mentoring'],
    socialLinks: {
      website: 'https://upperroomgospel.org',
    },
    rating: null,
    endorsements: 0,
  },
  {
    id: 'brandon-fonville',
    name: 'Brandon J. Fonville',
    profilePhoto: 'https://ui-avatars.com/api/?name=Brandon+Fonville&background=003366&color=c9a227&size=400&bold=true',
    jobTitle: 'Founder & Lead Product Designer',
    jobTypeId: 'creative-design',
    specialtyId: 'product-design',
    specialty: 'Product Design',
    skills: ['Product Design', 'Brand Identity', 'Figma', 'Graphic Design', 'Website Design'],
    yearsExperience: 10,
    company: 'Brandon Fonville Creative Studio',
    location: 'Raleigh, NC',
    bio: 'Brandon J. Fonville is a product and brand designer serving ministries, founders, and community organizations. A U.S. Navy veteran, he brings clarity and craft to digital products, brand systems, and websites — and is helping build the Upper Room COGIC Professional Network so congregation members can find and support one another.',
    portfolio: 'https://brandonfonville.com',
    availability: ['Freelance', 'Mentoring'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/brandonjfonville',
      website: 'https://brandonfonville.com',
    },
    rating: null,
    endorsements: 0,
  },
  {
    id: 'damian-little',
    name: 'Damian Little',
    profilePhoto: 'https://ui-avatars.com/api/?name=Damian+Little&background=003366&color=c9a227&size=400&bold=true',
    jobTitle: 'Heating & Air Conditioning Specialist',
    jobTypeId: 'trades-services',
    specialtyId: 'hvac',
    specialty: 'HVAC',
    skills: [
      'Industry Knowledge',
      'Interpersonal Skills',
      'Customer Service',
      'Team Leadership',
      'Problem Solving',
      'Critical Thinking',
      'Time Management',
    ],
    yearsExperience: 8,
    company: 'Temperature Pros LLC',
    location: 'Raleigh, NC',
    bio: 'Damian Little is a Heating & Air Conditioning Specialist with Temperature Pros LLC and eight years of experience delivering reliable, cost-effective HVAC service. As a licensed field specialist, he handles routine maintenance, service, and repairs on residential and commercial systems. He holds Gas Furnace Commission (AHRI, Oct 2018), Trane Residential HVAC Certification (Trane, Oct 2018), and Refrigerant Handling EPA 608 (US EPA, Feb 2012). His work is grounded in honesty, punctuality, and superior customer service.',
    portfolio: 'https://www.linkedin.com/in/damian-little-4694001a0',
    availability: ['Freelance'],
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/damian-little-4694001a0',
    },
    rating: null,
    endorsements: 1,
  },
]

export const members = [...foundingMembers, ...demoBots]

export function getJobType(id) {
  return jobTypes.find((t) => t.id === id)
}

export function getSpecialty(jobTypeId, specialtyId) {
  const jobType = getJobType(jobTypeId)
  return jobType?.specialties.find((s) => s.id === specialtyId)
}

export function getMembersByJobType(jobTypeId) {
  return _members.filter((m) => m.jobTypeId === jobTypeId)
}

export function getMembersBySpecialty(jobTypeId, specialtyId) {
  return _members.filter((m) => m.jobTypeId === jobTypeId && m.specialtyId === specialtyId)
}

export function getMember(id) {
  return _members.find((m) => m.id === id)
}

export function getAllSpecialties() {
  return jobTypes.flatMap((jobType) =>
    jobType.specialties.map((specialty) => ({
      ...specialty,
      jobTypeId: jobType.id,
      jobTypeName: jobType.name,
    })),
  )
}

const memberEnhancements = {
  'bishop-patrick-l-wooden-sr': {
    featured: true,
    joinedAt: '2025-10-03',
    listOrder: 3000,
    actionsDisabled: true,
    endorsementQuotes: [
      {
        author: 'Upper Room Congregation',
        text: 'A faithful shepherd who leads with love, compassion, strength, and sincerity — always willing to speak the truth in love.',
      },
    ],
  },
  'clarence-rocky-raeford': {
    featured: true,
    joinedAt: '2025-12-01',
    listOrder: 2000,
    endorsementQuotes: [
      {
        author: 'Bishop Patrick L. Wooden Sr.',
        text: 'Rocky elevates every worship experience with excellence and heart. His gift blesses our church and helps the next generation discover their passion for music.',
      },
    ],
  },
  'brandon-fonville': {
    featured: true,
    joinedAt: '2026-07-06',
    listOrder: 1000,
    endorsementQuotes: [],
  },
  'damian-little': {
    featured: true,
    joinedAt: '2026-07-28',
    listOrder: 900,
    endorsementQuotes: [],
  },
}

members.forEach((member) => {
  if (member.isBot) {
    member.verified = false
    member.featured = false
    return
  }
  Object.assign(member, { verified: true }, memberEnhancements[member.id] || {})
})

let _members = [...members]

export function bindMembers(list) {
  _members = list
}

export function getSeedMembers() {
  return JSON.parse(JSON.stringify(members)).map((member) =>
    member.isBot
      ? { ...member, verified: false, featured: false, actionsDisabled: true }
      : member,
  )
}

/** Bump when seed roster changes so browsers re-seed instead of keeping stale demo data. */
export const SEED_VERSION = 'v5-globe-demo-bots-2'

export function getFeaturedMembers() {
  return _members.filter((m) => m.featured && !m.isBot)
}

export function getSimilarMembers(member, limit = 3) {
  return _members
    .filter(
      (m) =>
        m.id !== member.id &&
        Boolean(m.isBot) === Boolean(member.isBot) &&
        (m.specialtyId === member.specialtyId || m.jobTypeId === member.jobTypeId || m.location === member.location),
    )
    .slice(0, limit)
}

const NEW_MEMBER_DAYS = 120

export function getNewMembers(limit = 4) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_MEMBER_DAYS)

  return _members
    .filter((m) => !m.isBot && m.joinedAt && new Date(m.joinedAt) >= cutoff)
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    .slice(0, limit)
}

export function isNewMember(member) {
  if (!member.joinedAt || member.isBot) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_MEMBER_DAYS)
  return new Date(member.joinedAt) >= cutoff
}

export function getCityGroups() {
  const groups = new Map()

  _members.forEach((member) => {
    if (!groups.has(member.location)) {
      groups.set(member.location, [])
    }
    groups.get(member.location).push(member)
  })

  return [...groups.entries()]
    .map(([location, cityMembers]) => ({
      location,
      slug: locationToSlug(location),
      count: cityMembers.length,
      members: cityMembers,
    }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location))
}

export function getCityBySlug(slug) {
  return getCityGroups().find((city) => city.slug === slug) || null
}

export function getMembersInCity(location, excludeId = null) {
  return _members.filter((m) => m.location === location && m.id !== excludeId)
}

export function getStateGroups() {
  const byState = new Map()

  _members.forEach((member) => {
    const parsed = parseLocation(member.location)
    if (!parsed) return

    if (!byState.has(parsed.stateCode)) {
      byState.set(parsed.stateCode, {
        code: parsed.stateCode,
        name: parsed.stateName,
        lat: parsed.lat,
        lng: parsed.lng,
        cities: new Map(),
      })
    }

    const state = byState.get(parsed.stateCode)
    const cityKey = parsed.city.toLowerCase()
    if (!state.cities.has(cityKey)) {
      state.cities.set(cityKey, {
        city: parsed.city,
        location: `${parsed.city}, ${parsed.stateCode}`,
        slug: locationToSlug(`${parsed.city}, ${parsed.stateCode}`),
        members: [],
      })
    }
    state.cities.get(cityKey).members.push(member)
  })

  return [...byState.values()]
    .map((state) => {
      const cities = [...state.cities.values()]
        .map((city) => ({ ...city, count: city.members.length }))
        .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
      return {
        code: state.code,
        name: state.name,
        lat: state.lat,
        lng: state.lng,
        cities,
        count: cities.reduce((sum, city) => sum + city.count, 0),
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getStateByCode(code) {
  return getStateGroups().find((state) => state.code === code) || null
}

function locationToSlug(location) {
  return location.toLowerCase().replace(/,\s*/g, '-').replace(/\s+/g, '-')
}
