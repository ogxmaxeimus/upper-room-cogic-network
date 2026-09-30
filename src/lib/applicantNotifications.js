import { COORDINATOR_EMAIL, NETWORK_NAME } from '../data/site'

const APPLICANT_APP_KEY = 'ur-network-my-application-id'

export function saveApplicantApplicationId(applicationId) {
  localStorage.setItem(APPLICANT_APP_KEY, applicationId)
}

export function getApplicantApplicationId() {
  return localStorage.getItem(APPLICANT_APP_KEY)
}

export function applicationStatusPath(applicationId) {
  return `/join/status/${applicationId}`
}

export function buildApprovalMailto(application, publicProfileUrl) {
  const subject = `Your ${NETWORK_NAME} application was approved`
  const body = [
    `Dear ${application.name},`,
    '',
    `Thank you for applying to join the ${NETWORK_NAME}.`,
    '',
    'Your application has been reviewed and approved. Your profile is now published on the directory.',
    publicProfileUrl ? `View your profile: ${publicProfileUrl}` : '',
    '',
    'If you need to update your listing, please reply to this email and a coordinator will assist you.',
    '',
    'Blessings,',
    'Upper Room COGIC Network Coordinators',
  ].filter(Boolean).join('\n')

  return `mailto:${application.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&cc=${encodeURIComponent(COORDINATOR_EMAIL)}`
}

export function buildRejectionMailto(application, reason) {
  const subject = `Update on your ${NETWORK_NAME} application`
  const body = [
    `Dear ${application.name},`,
    '',
    `Thank you for your interest in joining the ${NETWORK_NAME}.`,
    '',
    'After review, we are unable to approve your application at this time.',
    reason ? `\nNote from coordinator: ${reason}` : '',
    '',
    'If you have questions or would like to reapply with additional information, please reply to this email.',
    '',
    'Blessings,',
    'Upper Room COGIC Network Coordinators',
  ].filter(Boolean).join('\n')

  return `mailto:${application.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&cc=${encodeURIComponent(COORDINATOR_EMAIL)}`
}
