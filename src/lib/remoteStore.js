/**
 * Remote shared store.
 * Prefers Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set;
 * otherwise uses Netlify Functions + Blobs.
 */

import { getAdminPassword } from './adminAuth'
import { isSupabaseConfigured } from './supabaseClient'
import * as supabaseStore from './supabaseStore'

const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions/network'

function adminHeaders(password = getAdminPassword()) {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Password': password,
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.admin ? adminHeaders() : { 'Content-Type': 'application/json' }),
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

let remoteAvailable = null
let backend = null // 'supabase' | 'netlify' | null

export async function probeRemote() {
  if (remoteAvailable !== null) return remoteAvailable

  if (isSupabaseConfigured()) {
    const ok = await supabaseStore.probeRemote()
    if (ok) {
      backend = 'supabase'
      remoteAvailable = true
      return true
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${API_BASE}?action=health`, { signal: controller.signal })
    clearTimeout(timer)
    if (res.ok) {
      backend = 'netlify'
      remoteAvailable = true
      return true
    }
  } catch {
    // fall through
  }

  remoteAvailable = false
  backend = null
  return false
}

export function isRemoteConfigured() {
  return remoteAvailable === true
}

export function getRemoteBackend() {
  return backend
}

export async function remoteGetMembers() {
  if (backend === 'supabase') return supabaseStore.remoteGetMembers()
  const data = await request('?action=members')
  return data.members || []
}

export async function remoteSaveMembers(members) {
  if (backend === 'supabase') return supabaseStore.remoteSaveMembers(members)
  return request('?action=members', {
    method: 'PUT',
    admin: true,
    body: JSON.stringify({ members }),
  })
}

export async function remoteGetApplications() {
  if (backend === 'supabase') return supabaseStore.remoteGetApplications()
  const data = await request('?action=applications', { admin: true })
  return data.applications || []
}

export async function remoteSubmitApplication(application) {
  if (backend === 'supabase') return supabaseStore.remoteSubmitApplication(application)
  return request('?action=applications', {
    method: 'POST',
    body: JSON.stringify({ application }),
  })
}

export async function remoteUpdateApplication(id, patch) {
  if (backend === 'supabase') return supabaseStore.remoteUpdateApplication(id, patch)
  return request('?action=applications', {
    method: 'PATCH',
    admin: true,
    body: JSON.stringify({ id, patch }),
  })
}

export async function remoteGetContacts() {
  if (backend === 'supabase') return supabaseStore.remoteGetContacts()
  const data = await request('?action=contacts', { admin: true })
  return data.contacts || []
}

export async function remoteSaveContact(contact) {
  if (backend === 'supabase') return supabaseStore.remoteSaveContact(contact)
  return request('?action=contacts', {
    method: 'POST',
    body: JSON.stringify({ contact }),
  })
}

export async function remoteExport() {
  if (backend === 'supabase') return supabaseStore.remoteExport()
  return request('?action=export', { admin: true })
}

export async function remoteImport(payload) {
  if (backend === 'supabase') return supabaseStore.remoteImport(payload)
  return request('?action=import', {
    method: 'POST',
    admin: true,
    body: JSON.stringify(payload),
  })
}

export async function remoteSeedIfEmpty(seedMembers) {
  if (backend === 'supabase') {
    try {
      return await supabaseStore.remoteSeedIfEmpty(seedMembers)
    } catch (err) {
      // Seed needs the Netlify function + service role. Directory still loads without it.
      console.warn('Supabase seed skipped (start `netlify dev` with SUPABASE_SERVICE_ROLE_KEY to seed).', err)
      return { seeded: false }
    }
  }
  return request('?action=seed', {
    method: 'POST',
    admin: true,
    body: JSON.stringify({ members: seedMembers }),
  })
}

/** Verify a password against the shared admin secret (env or Blobs override).
 * @returns {Promise<true|false|null>} true ok, false rejected, null unreachable
 */
export async function remoteVerifyAdmin(password) {
  if (backend === 'supabase') return supabaseStore.remoteVerifyAdmin(password)
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

/** Persist a new shared admin password (SHA-256 hash in Netlify Blobs). */
export async function remoteChangePassword(currentPassword, newPassword) {
  if (backend === 'supabase') {
    return supabaseStore.remoteChangePassword(currentPassword, newPassword)
  }
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
