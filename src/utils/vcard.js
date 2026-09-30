export function locationToSlug(location) {
  return location.toLowerCase().replace(/,\s*/g, '-').replace(/\s+/g, '-')
}

export function buildVCard(member) {
  const escape = (value) =>
    String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(member.name)}`,
    `TITLE:${escape(member.jobTitle)}`,
    `ORG:${escape(member.company)}`,
    `ADR:;;${escape(member.location)};;;;`,
  ]

  if (member.portfolio) lines.push(`URL:${member.portfolio}`)
  if (member.calendly) lines.push(`URL;TYPE=booking:${member.calendly}`)
  if (member.socialLinks?.website) lines.push(`URL;TYPE=website:${member.socialLinks.website}`)
  if (member.bio) lines.push(`NOTE:${escape(member.bio)}`)

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function downloadVCard(member) {
  const blob = new Blob([buildVCard(member)], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${member.id}.vcf`
  link.click()
  URL.revokeObjectURL(url)
}
