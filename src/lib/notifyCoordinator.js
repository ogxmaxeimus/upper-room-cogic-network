import { COORDINATOR_EMAIL, NETWORK_NAME } from '../data/site'

/**
 * Notify the coordinator when someone applies or requests an introduction.
 *
 * Preferred: set VITE_FORMSPREE_ENDPOINT to a Formspree form URL
 * (e.g. https://formspree.io/f/xxxxxxxx). Submissions email the address
 * configured in Formspree — typically VITE_COORDINATOR_EMAIL.
 *
 * Fallback: opens a mailto: draft so the submitter can send manually.
 * Success UI should be honest about which path ran.
 */

const FORMSPREE = import.meta.env.VITE_FORMSPREE_ENDPOINT || ''

export function hasFormspree() {
  return Boolean(FORMSPREE && FORMSPREE.startsWith('http'))
}

async function postFormspree(payload) {
  const res = await fetch(FORMSPREE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: payload.subject,
      _replyto: payload.replyTo,
      email: payload.replyTo,
      message: payload.body,
      ...payload.fields,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Notification failed (${res.status})`)
  }
  return { channel: 'formspree' }
}

function mailtoFallback({ subject, body, replyTo }) {
  const href = `mailto:${COORDINATOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${replyTo ? `&cc=${encodeURIComponent(replyTo)}` : ''}`
  return { channel: 'mailto', href }
}

export async function notifyCoordinatorOfApplication(application) {
  const subject = `[${NETWORK_NAME}] New join application — ${application.name}`
  const body = [
    `A new join application was submitted.`,
    '',
    `Name: ${application.name}`,
    `Email: ${application.email}`,
    application.phone ? `Phone: ${application.phone}` : null,
    `Title: ${application.jobTitle}`,
    application.location ? `Location: ${application.location}` : null,
    application.bio ? `\nBio:\n${application.bio}` : null,
    '',
    `Application ID: ${application.id}`,
    `Review in admin: /admin/applications/${application.id}`,
  ].filter((line) => line !== null).join('\n')

  if (hasFormspree()) {
    try {
      return await postFormspree({
        subject,
        body,
        replyTo: application.email,
        fields: {
          type: 'join_application',
          applicationId: application.id,
          name: application.name,
          jobTitle: application.jobTitle,
        },
      })
    } catch (err) {
      console.warn('Formspree application notify failed; falling back to mailto.', err)
    }
  }

  return mailtoFallback({ subject, body, replyTo: application.email })
}

export async function notifyCoordinatorOfContact(request) {
  const subject = `[${NETWORK_NAME}] Introduction request for ${request.memberName}`
  const body = [
    `Someone requested an introduction.`,
    '',
    `To member: ${request.memberName} (${request.memberId})`,
    `From: ${request.name}`,
    `Email: ${request.email}`,
    request.phone ? `Phone: ${request.phone}` : null,
    `Type: ${request.requestType || 'general'}`,
    '',
    `Message:`,
    request.message,
  ].filter((line) => line !== null).join('\n')

  if (hasFormspree()) {
    try {
      return await postFormspree({
        subject,
        body,
        replyTo: request.email,
        fields: {
          type: 'contact_request',
          memberId: request.memberId,
          memberName: request.memberName,
          name: request.name,
          requestType: request.requestType,
        },
      })
    } catch (err) {
      console.warn('Formspree contact notify failed; falling back to mailto.', err)
    }
  }

  return mailtoFallback({ subject, body, replyTo: request.email })
}
