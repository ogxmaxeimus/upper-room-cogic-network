/**
 * Shared store via Supabase Postgres (optional alternative to Netlify Blobs).
 * Public reads/inserts use the anon key. Admin writes require the Netlify
 * function with SUPABASE_SERVICE_ROLE_KEY (see netlify/functions/network.mjs).
 */

import { getAdminPassword } from './adminAuth'
import { getSupabase, isSupabaseConfigured } from './supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions/network'

function adminHeaders(password = getAdminPassword()) {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Password': password,
  }
}

async function adminApi(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
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

let remoteAvailable = null

export async function probeRemote() {
  if (remoteAvailable !== null) return remoteAvailable
  if (!isSupabaseConfigured()) {
    remoteAvailable = false
    return false
  }
  try {
    const supabase = getSupabase()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const { error } = await supabase
      .from('members')
      .select('id', { head: true, count: 'exact' })
      .abortSignal(controller.signal)
    clearTimeout(timer)
    remoteAvailable = !error
  } catch {
    remoteAvailable = false
  }
  return remoteAvailable
}

export function isRemoteConfigured() {
  return remoteAvailable === true
}

export async function remoteGetMembers() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('members')
    .select('id, payload, status, list_order')
    .neq('status', 'archived')
    .order('list_order', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToMember)
}

export async function remoteSaveMembers(members) {
  // Admin write — service role via Netlify function
  return adminApi('?action=members', {
    method: 'PUT',
    body: JSON.stringify({ members }),
  })
}

export async function remoteGetApplications() {
  return adminApi('?action=applications').then((data) => data.applications || [])
}

export async function remoteSubmitApplication(application) {
  const supabase = getSupabase()
  const row = applicationToRow(application)
  const { data, error } = await supabase.from('applications').insert(row).select().single()
  if (error) throw error
  return { application: rowToApplication(data) }
}

export async function remoteUpdateApplication(id, patch) {
  return adminApi('?action=applications', {
    method: 'PATCH',
    body: JSON.stringify({ id, patch }),
  })
}

export async function remoteGetContacts() {
  return adminApi('?action=contacts').then((data) => data.contacts || [])
}

export async function remoteSaveContact(contact) {
  const supabase = getSupabase()
  const row = contactToRow(contact)
  const { data, error } = await supabase.from('contact_requests').insert(row).select().single()
  if (error) throw error
  return { contact: rowToContact(data) }
}

export async function remoteExport() {
  return adminApi('?action=export')
}

export async function remoteImport(payload) {
  return adminApi('?action=import', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function remoteSeedIfEmpty(seedMembers) {
  return adminApi('?action=seed', {
    method: 'POST',
    body: JSON.stringify({ members: seedMembers }),
  })
}

/** @returns {Promise<true|false|null>} true ok, false rejected, null unreachable */
export async function remoteVerifyAdmin(password) {
  try {
    const res = await fetch(`${API_BASE}?action=verify-admin`, {
      method: 'POST',
      headers: adminHeaders(password),
      body: JSON.stringify({}),
    })
    if (res.ok) return true
    if (res.status === 401) return false
    return null
  } catch {
    return null
  }
}

export async function remoteChangePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}?action=change-password`, {
    method: 'POST',
    headers: adminHeaders(currentPassword),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export { memberToRow, applicationToRow, contactToRow, rowToMember, rowToApplication, rowToContact }
