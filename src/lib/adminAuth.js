const ADMIN_SESSION_KEY = 'ur-admin-session'
const ADMIN_PASSWORD_OVERRIDE_KEY = 'ur-admin-password-override'
const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'upperroomcogic'

export const PASSWORD_MIN_LENGTH = 8

/** Active admin password for login checks and API headers. */
export function getAdminPassword() {
  try {
    const override = localStorage.getItem(ADMIN_PASSWORD_OVERRIDE_KEY)
    if (override) return override
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_PASSWORD
}

function setAdminPasswordOverride(password) {
  localStorage.setItem(ADMIN_PASSWORD_OVERRIDE_KEY, password)
}

export function validateNewPassword(newPassword, confirmPassword, currentPassword) {
  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    return `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (/\s/.test(newPassword)) {
    return 'New password cannot contain spaces.'
  }
  if (newPassword !== confirmPassword) {
    return 'New password and confirmation do not match.'
  }
  if (currentPassword != null && newPassword === currentPassword) {
    return 'New password must be different from the current password.'
  }
  // Basic strength: not only letters or only digits
  const hasLetter = /[A-Za-z]/.test(newPassword)
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(newPassword)
  if (!hasLetter || !hasNumberOrSymbol) {
    return 'Use letters plus at least one number or symbol.'
  }
  return null
}

export function loginAdmin(password) {
  if (password !== getAdminPassword()) return false
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    authenticated: true,
    at: new Date().toISOString(),
  }))
  return true
}

/**
 * Prefer shared-server verification when available so a password changed on
 * another device cannot be bypassed with a stale env default.
 * Falls back to local/env password when the API is unreachable.
 */
export async function loginAdminAsync(password, remoteVerify) {
  if (typeof remoteVerify === 'function') {
    try {
      const result = await remoteVerify(password)
      if (result === true) {
        setAdminPasswordOverride(password)
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
          authenticated: true,
          at: new Date().toISOString(),
        }))
        return true
      }
      if (result === false) {
        return false
      }
      // null / unreachable → local fallback
    } catch {
      // fall through
    }
  }
  return loginAdmin(password)
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminAuthenticated() {
  try {
    const session = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')
    return Boolean(session?.authenticated)
  } catch {
    return false
  }
}

/**
 * Change the coordinator password after verifying the current one.
 * Always updates this browser; optionally syncs to the shared API.
 *
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string, remoteChange?: (current: string, next: string) => Promise<void> }} opts
 */
export async function changeAdminPassword({
  currentPassword,
  newPassword,
  confirmPassword,
  remoteChange,
}) {
  if (currentPassword !== getAdminPassword()) {
    return { ok: false, error: 'Current password is incorrect.' }
  }

  const validationError = validateNewPassword(newPassword, confirmPassword, currentPassword)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  if (typeof remoteChange === 'function') {
    try {
      await remoteChange(currentPassword, newPassword)
    } catch (err) {
      const status = err?.status
      if (status === 401) {
        return { ok: false, error: 'Current password was rejected by the server.' }
      }
      // Remote unavailable: still save locally so this browser keeps working
      if (status && status !== 404) {
        return {
          ok: false,
          error: err.message || 'Could not update the shared admin password. Try again.',
        }
      }
    }
  }

  setAdminPasswordOverride(newPassword)
  return { ok: true }
}
