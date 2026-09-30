export default function VerifiedBadge({ compact = false }) {
  return (
    <span className={`verified-badge${compact ? ' verified-badge--compact' : ''}`} title="Verified Upper Room COGIC member">
      {compact ? '✓' : '✓ Verified Member'}
    </span>
  )
}
