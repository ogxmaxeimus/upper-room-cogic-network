import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { getStore } from '@netlify/blobs'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'upperroomcogic'
const ADMIN_PASSWORD_HASH_KEY = 'admin-password-hash'
const PASSWORD_MIN_LENGTH = 8
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    },
  })
}

function unauthorized() {
  return json(401, { error: 'Unauthorized' })
}

function hashPassword(password) {
  return createHash('sha256').update(String(password), 'utf8').digest('hex')
}

async function getStoredPasswordHash() {
  try {
    const store = await getStoreSafe()
    const hash = await store.get(ADMIN_PASSWORD_HASH_KEY, { type: 'text' })
    return hash || null
  } catch {
    return null
  }
}

async function passwordMatches(password) {
  if (!password) return false
  const storedHash = await getStoredPasswordHash()
  if (storedHash) {
    return hashPassword(password) === storedHash
  }
  return password === ADMIN_PASSWORD
}

async function requireAdmin(request) {
  const header = request.headers.get('x-admin-password') || ''
  return passwordMatches(header)
}

function validateNewPassword(newPassword) {
  if (!newPassword || String(newPassword).length < PASSWORD_MIN_LENGTH) {
    return `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (/\s/.test(newPassword)) {
    return 'New password cannot contain spaces.'
  }
  const hasLetter = /[A-Za-z]/.test(newPassword)
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(newPassword)
  if (!hasLetter || !hasNumberOrSymbol) {
    return 'Use letters plus at least one number or symbol.'
  }
  return null
}

function useSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function rowToMember(row) {
  return {
    ...row.payload,
    id: row.id,
    status: row.status || row.payload?.status || 'published',
    listOrder: row.list_order ?? row.payload?.listOrder ?? 0,
  }
}

function memberToRow(member) {
  return {
    id: member.id,
    payload: member,
    status: member.status || 'published',
    list_order: member.listOrder ?? 0,
    updated_at: new Date().toISOString(),
  }
}

function rowToApplication(row) {
  return {
    ...row.payload,
    id: row.id,
    status: row.status || row.payload?.status || 'pending',
    submittedAt: row.submitted_at || row.payload?.submittedAt,
    reviewedAt: row.reviewed_at ?? row.payload?.reviewedAt ?? null,
  }
}

function applicationToRow(application) {
  return {
    id: application.id,
    payload: application,
    status: application.status || 'pending',
    submitted_at: application.submittedAt || new Date().toISOString(),
    reviewed_at: application.reviewedAt || null,
  }
}

function rowToContact(row) {
  return {
    ...row.payload,
    id: row.id,
    submittedAt: row.submitted_at || row.payload?.submittedAt,
  }
}

function contactToRow(contact) {
  return {
    id: contact.id,
    payload: contact,
    submitted_at: contact.submittedAt || new Date().toISOString(),
  }
}

async function getStoreSafe() {
  return getStore({ name: 'ur-network', consistency: 'strong' })
}

async function readJson(store, key, fallback) {
  const value = await store.get(key, { type: 'json' })
  return value ?? fallback
}

async function writeJson(store, key, value) {
  await store.setJSON(key, value)
}

async function handleSupabase(request, action) {
  const supabase = getSupabaseAdmin()

  if (action === 'members' && request.method === 'GET') {
    const { data, error } = await supabase
      .from('members')
      .select('id, payload, status, list_order')
      .neq('status', 'archived')
      .order('list_order', { ascending: false })
    if (error) throw error
    return json(200, { members: (data || []).map(rowToMember) })
  }

  if (action === 'members' && request.method === 'PUT') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    const members = body.members || []
    const rows = members.map(memberToRow)

    const { error: delError } = await supabase.from('members').delete().neq('id', '')
    if (delError) throw delError

    if (rows.length) {
      const { error } = await supabase.from('members').insert(rows)
      if (error) throw error
    }
    return json(200, { ok: true })
  }

  if (action === 'applications' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    const { data, error } = await supabase
      .from('applications')
      .select('id, payload, status, submitted_at, reviewed_at')
      .order('submitted_at', { ascending: false })
    if (error) throw error
    return json(200, { applications: (data || []).map(rowToApplication) })
  }

  if (action === 'applications' && request.method === 'POST') {
    const body = await request.json()
    const row = applicationToRow(body.application)
    const { data, error } = await supabase.from('applications').insert(row).select().single()
    if (error) throw error
    return json(201, { application: rowToApplication(data) })
  }

  if (action === 'applications' && request.method === 'PATCH') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('id, payload, status, submitted_at, reviewed_at')
      .eq('id', body.id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!existing) return json(404, { error: 'Not found' })

    const merged = { ...rowToApplication(existing), ...body.patch }
    const row = applicationToRow(merged)
    const { data, error } = await supabase
      .from('applications')
      .update({
        payload: row.payload,
        status: row.status,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
      })
      .eq('id', body.id)
      .select()
      .single()
    if (error) throw error
    return json(200, { application: rowToApplication(data) })
  }

  if (action === 'contacts' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    const { data, error } = await supabase
      .from('contact_requests')
      .select('id, payload, submitted_at')
      .order('submitted_at', { ascending: false })
    if (error) throw error
    return json(200, { contacts: (data || []).map(rowToContact) })
  }

  if (action === 'contacts' && request.method === 'POST') {
    const body = await request.json()
    const row = contactToRow(body.contact)
    const { data, error } = await supabase.from('contact_requests').insert(row).select().single()
    if (error) throw error
    return json(201, { contact: rowToContact(data) })
  }

  if (action === 'seed' && request.method === 'POST') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    const { count, error: countError } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
    if (countError) throw countError

    if (!count) {
      const seeded = (body.members || []).map((m) =>
        memberToRow({ ...m, status: 'published', source: 'seed' }),
      )
      if (seeded.length) {
        const { error } = await supabase.from('members').insert(seeded)
        if (error) throw error
      }
      return json(200, { seeded: true, count: seeded.length })
    }
    return json(200, { seeded: false, count })
  }

  if (action === 'export' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    const [membersRes, appsRes, contactsRes] = await Promise.all([
      supabase.from('members').select('id, payload, status, list_order'),
      supabase.from('applications').select('id, payload, status, submitted_at, reviewed_at'),
      supabase.from('contact_requests').select('id, payload, submitted_at'),
    ])
    if (membersRes.error) throw membersRes.error
    if (appsRes.error) throw appsRes.error
    if (contactsRes.error) throw contactsRes.error
    return json(200, {
      members: (membersRes.data || []).map(rowToMember),
      applications: (appsRes.data || []).map(rowToApplication),
      contacts: (contactsRes.data || []).map(rowToContact),
      exportedAt: new Date().toISOString(),
    })
  }

  if (action === 'import' && request.method === 'POST') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()

    if (body.members) {
      await supabase.from('members').delete().neq('id', '')
      if (body.members.length) {
        const { error } = await supabase.from('members').insert(body.members.map(memberToRow))
        if (error) throw error
      }
    }
    if (body.applications) {
      await supabase.from('applications').delete().neq('id', '')
      if (body.applications.length) {
        const { error } = await supabase.from('applications').insert(body.applications.map(applicationToRow))
        if (error) throw error
      }
    }
    if (body.contacts) {
      await supabase.from('contact_requests').delete().neq('id', '')
      if (body.contacts.length) {
        const { error } = await supabase.from('contact_requests').insert(body.contacts.map(contactToRow))
        if (error) throw error
      }
    }
    return json(200, { ok: true })
  }

  return json(400, { error: `Unknown action: ${action}` })
}

async function handleBlobs(request, action) {
  const store = await getStoreSafe()

  if (action === 'members' && request.method === 'GET') {
    const members = await readJson(store, 'members', [])
    const published = members.filter((m) => m.status !== 'archived')
    return json(200, { members: published })
  }

  if (action === 'members' && request.method === 'PUT') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    await writeJson(store, 'members', body.members || [])
    return json(200, { ok: true })
  }

  if (action === 'applications' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    const applications = await readJson(store, 'applications', [])
    return json(200, { applications })
  }

  if (action === 'applications' && request.method === 'POST') {
    const body = await request.json()
    const applications = await readJson(store, 'applications', [])
    applications.push(body.application)
    await writeJson(store, 'applications', applications)
    return json(201, { application: body.application })
  }

  if (action === 'applications' && request.method === 'PATCH') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    const applications = await readJson(store, 'applications', [])
    const index = applications.findIndex((a) => a.id === body.id)
    if (index === -1) return json(404, { error: 'Not found' })
    applications[index] = { ...applications[index], ...body.patch }
    await writeJson(store, 'applications', applications)
    return json(200, { application: applications[index] })
  }

  if (action === 'contacts' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    const contacts = await readJson(store, 'contacts', [])
    return json(200, { contacts })
  }

  if (action === 'contacts' && request.method === 'POST') {
    const body = await request.json()
    const contacts = await readJson(store, 'contacts', [])
    contacts.push(body.contact)
    await writeJson(store, 'contacts', contacts)
    return json(201, { contact: body.contact })
  }

  if (action === 'seed' && request.method === 'POST') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    const existing = await readJson(store, 'members', [])
    if (!existing.length) {
      const seeded = (body.members || []).map((m) => ({
        ...m,
        status: 'published',
        source: 'seed',
      }))
      await writeJson(store, 'members', seeded)
      return json(200, { seeded: true, count: seeded.length })
    }
    return json(200, { seeded: false, count: existing.length })
  }

  if (action === 'export' && request.method === 'GET') {
    if (!requireAdmin(request)) return unauthorized()
    return json(200, {
      members: await readJson(store, 'members', []),
      applications: await readJson(store, 'applications', []),
      contacts: await readJson(store, 'contacts', []),
      exportedAt: new Date().toISOString(),
    })
  }

  if (action === 'import' && request.method === 'POST') {
    if (!requireAdmin(request)) return unauthorized()
    const body = await request.json()
    if (body.members) await writeJson(store, 'members', body.members)
    if (body.applications) await writeJson(store, 'applications', body.applications)
    if (body.contacts) await writeJson(store, 'contacts', body.contacts)
    return json(200, { ok: true })
  }

  return json(400, { error: `Unknown action: ${action}` })
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return json(204, {})
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'health'

  try {
    if (action === 'health') {
      return json(200, {
        ok: true,
        service: 'ur-network',
        backend: useSupabase() ? 'supabase' : 'blobs',
      })
    }

    if (action === 'verify-admin' && request.method === 'POST') {
      if (!(await requireAdmin(request))) return unauthorized()
      return json(200, { ok: true })
    }

    if (action === 'change-password' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const currentPassword =
        body.currentPassword || request.headers.get('x-admin-password') || ''
      const newPassword = body.newPassword || ''

      if (!(await passwordMatches(currentPassword))) return unauthorized()

      const validationError = validateNewPassword(newPassword)
      if (validationError) return json(400, { error: validationError })
      if (newPassword === currentPassword) {
        return json(400, { error: 'New password must be different from the current password.' })
      }

      const store = await getStoreSafe()
      await store.set(ADMIN_PASSWORD_HASH_KEY, hashPassword(newPassword))
      return json(200, { ok: true })
    }

    if (useSupabase()) {
      return await handleSupabase(request, action)
    }
    return await handleBlobs(request, action)
  } catch (err) {
    console.error(err)
    return json(500, { error: err.message || 'Server error' })
  }
}

export const config = {
  path: '/.netlify/functions/network',
}
