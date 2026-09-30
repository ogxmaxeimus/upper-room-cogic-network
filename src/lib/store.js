import { SEED_VERSION } from '../data/network'
import * as remote from './remoteStore'

const KEYS = {
  seedVersion: 'ur-network-seed-version',
  members: 'ur-network-members',
  applications: 'ur-network-applications',
  contacts: 'ur-network-contacts',
  mode: 'ur-network-storage-mode',
}

let useRemote = false
let memory = {
  members: [],
  applications: [],
  contacts: [],
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function sortMembersByListOrder(members) {
  return [...members].sort((a, b) => {
    const orderDiff = (b.listOrder || 0) - (a.listOrder || 0)
    if (orderDiff !== 0) return orderDiff
    return a.name.localeCompare(b.name)
  })
}

export function nextListOrder() {
  return Date.now()
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function createMemberId(name) {
  return `${slugify(name)}-${Date.now().toString(36)}`
}

export function getStorageMode() {
  return useRemote ? 'remote' : 'local'
}

/**
 * Clear outdated demo seed data when SEED_VERSION changes.
 * Keeps applications/contacts unless they are empty and only seed members existed.
 */
function maybeReseedLocal(seedMembers) {
  const storedVersion = localStorage.getItem(KEYS.seedVersion)
  if (storedVersion === SEED_VERSION) {
    return readLocal(KEYS.members)
  }

  // Version bump: replace seed-only directory; preserve manually added / approved members
  const existing = readLocal(KEYS.members)
  const keepCustom = existing.filter((m) => m.source && m.source !== 'seed')
  const seeded = seedMembers.map((m) => ({ ...m, status: 'published', source: 'seed' }))
  const byId = new Map(seeded.map((m) => [m.id, m]))
  keepCustom.forEach((m) => byId.set(m.id, m))
  const next = [...byId.values()]
  writeLocal(KEYS.members, next)
  localStorage.setItem(KEYS.seedVersion, SEED_VERSION)
  return next
}

async function persistMembers(members) {
  memory.members = members
  writeLocal(KEYS.members, members)
  if (useRemote) {
    try {
      await remote.remoteSaveMembers(members)
    } catch (err) {
      console.warn('Remote member save failed; kept local copy.', err)
    }
  }
}

async function persistApplications(applications) {
  memory.applications = applications
  writeLocal(KEYS.applications, applications)
}

async function persistContacts(contacts) {
  memory.contacts = contacts
  writeLocal(KEYS.contacts, contacts)
}

export async function initStore(seedMembers) {
  useRemote = await remote.probeRemote()
  localStorage.setItem(KEYS.mode, useRemote ? 'remote' : 'local')

  if (useRemote) {
    try {
      await remote.remoteSeedIfEmpty(seedMembers)
      const [members, applications, contacts] = await Promise.all([
        remote.remoteGetMembers(),
        remote.remoteGetApplications().catch(() => readLocal(KEYS.applications)),
        remote.remoteGetContacts().catch(() => readLocal(KEYS.contacts)),
      ])
      memory = { members, applications, contacts }
      writeLocal(KEYS.members, members)
      writeLocal(KEYS.applications, applications)
      writeLocal(KEYS.contacts, contacts)
      localStorage.setItem(KEYS.seedVersion, SEED_VERSION)
      return members
    } catch (err) {
      console.warn('Remote init failed; using localStorage.', err)
      useRemote = false
    }
  }

  const members = maybeReseedLocal(seedMembers)
  memory = {
    members,
    applications: readLocal(KEYS.applications),
    contacts: readLocal(KEYS.contacts),
  }
  return members
}

/** One-time helper: clear local cache so the next load re-seeds / re-pulls. */
export function resetLocalNetworkCache() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
  memory = { members: [], applications: [], contacts: [] }
}

export function getStoredMembers() {
  return sortMembersByListOrder(memory.members.filter((m) => m.status !== 'archived'))
}

export function saveMembers(members) {
  memory.members = members
  writeLocal(KEYS.members, members)
  if (useRemote) {
    remote.remoteSaveMembers(members).catch((err) => {
      console.warn('Remote member save failed', err)
    })
  }
  return members.filter((m) => m.status !== 'archived')
}

export function getApplications(status) {
  const apps = [...memory.applications]
  const sorted = apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  if (!status) return sorted
  return sorted.filter((a) => a.status === status)
}

export function getApplication(id) {
  return memory.applications.find((a) => a.id === id) || null
}

export function submitApplication(data) {
  const application = {
    id: crypto.randomUUID(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    rejectionReason: null,
    createdMemberId: null,
    ...data,
  }
  memory.applications = [...memory.applications, application]
  writeLocal(KEYS.applications, memory.applications)
  if (useRemote) {
    remote.remoteSubmitApplication(application).catch((err) => {
      console.warn('Remote application submit failed; kept local copy.', err)
    })
  }
  return application
}

export function saveContactRequest(request) {
  const contact = { ...request, id: crypto.randomUUID(), submittedAt: new Date().toISOString() }
  memory.contacts = [...memory.contacts, contact]
  writeLocal(KEYS.contacts, memory.contacts)
  if (useRemote) {
    remote.remoteSaveContact(contact).catch((err) => {
      console.warn('Remote contact save failed; kept local copy.', err)
    })
  }
  return contact
}

export function getContactRequests() {
  return [...memory.contacts].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

function updateApplication(id, patch) {
  const index = memory.applications.findIndex((a) => a.id === id)
  if (index === -1) return null
  memory.applications[index] = { ...memory.applications[index], ...patch }
  writeLocal(KEYS.applications, memory.applications)
  if (useRemote) {
    remote.remoteUpdateApplication(id, patch).catch((err) => {
      console.warn('Remote application update failed', err)
    })
  }
  return memory.applications[index]
}

export function applicationToMember(application, specialtyName) {
  return {
    id: createMemberId(application.name),
    name: application.name,
    profilePhoto: application.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.name)}&background=003366&color=c9a227&size=400`,
    jobTitle: application.jobTitle,
    jobTypeId: application.jobTypeId,
    specialtyId: application.specialtyId || '',
    specialty: specialtyName || application.jobTitle,
    skills: application.skills || [],
    yearsExperience: application.yearsExperience || 0,
    company: application.company || '',
    location: application.location || 'Location TBD',
    bio: application.bio || '',
    portfolio: application.portfolio || null,
    calendly: application.calendly || null,
    availability: application.availability || [],
    socialLinks: application.socialLinks || {},
    rating: null,
    endorsements: 0,
    endorsementQuotes: [],
    verified: true,
    featured: false,
    joinedAt: new Date().toISOString().slice(0, 10),
    listOrder: 0,
    status: 'published',
    source: 'application',
    applicationId: application.id,
    affiliation: application.affiliation || 'Upper Room COGIC',
    email: application.email,
    phone: application.phone || '',
  }
}

export function approveApplication(applicationId, specialtyName, overrides = {}, { pinToTop = true } = {}) {
  const application = getApplication(applicationId)
  if (!application || application.status !== 'pending') return null

  const member = {
    ...applicationToMember(application, specialtyName),
    ...overrides,
    listOrder: pinToTop ? nextListOrder() : (overrides.listOrder ?? 0),
  }
  const members = [...memory.members, member]
  persistMembers(members)

  updateApplication(applicationId, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    createdMemberId: member.id,
  })

  return member
}

export function rejectApplication(applicationId, reason = '') {
  return updateApplication(applicationId, {
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason,
  })
}

export function createMemberManual(data) {
  const member = {
    id: data.id || createMemberId(data.name),
    profilePhoto: data.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=003366&color=c9a227&size=400`,
    skills: [],
    yearsExperience: 0,
    socialLinks: {},
    rating: null,
    endorsements: 0,
    endorsementQuotes: [],
    verified: true,
    featured: false,
    joinedAt: new Date().toISOString().slice(0, 10),
    listOrder: data.listOrder ?? nextListOrder(),
    status: 'published',
    source: 'manual',
    affiliation: 'Upper Room COGIC',
    ...data,
  }
  const members = [...memory.members, member]
  persistMembers(members)
  return member
}

export function updateMember(memberId, patch) {
  const index = memory.members.findIndex((m) => m.id === memberId)
  if (index === -1) return null
  memory.members[index] = { ...memory.members[index], ...patch }
  persistMembers(memory.members)
  return memory.members[index]
}

export function archiveMember(memberId) {
  return updateMember(memberId, { status: 'archived' })
}

export function moveMemberToTop(memberId) {
  return updateMember(memberId, { listOrder: nextListOrder() })
}

export function exportData() {
  return {
    members: memory.members,
    applications: memory.applications,
    contacts: memory.contacts,
    storageMode: getStorageMode(),
    exportedAt: new Date().toISOString(),
  }
}

export function importData(payload) {
  if (payload.members) {
    memory.members = payload.members
    writeLocal(KEYS.members, payload.members)
  }
  if (payload.applications) {
    memory.applications = payload.applications
    writeLocal(KEYS.applications, payload.applications)
  }
  if (payload.contacts) {
    memory.contacts = payload.contacts
    writeLocal(KEYS.contacts, payload.contacts)
  }
  if (useRemote) {
    remote.remoteImport(payload).catch((err) => {
      console.warn('Remote import failed', err)
    })
  }
}

// silence unused in some bundlers if tree-shaken oddly
void persistApplications
void persistContacts
