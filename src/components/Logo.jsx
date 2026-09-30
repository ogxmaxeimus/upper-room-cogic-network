import { Link } from 'react-router-dom'
import './Logo.css'

const LOGO_ASSETS = {
  'on-light': '/images/upper-room-logo-official.png',
  'on-dark': '/images/upper-room-logo-official-white.png',
}

export default function Logo({
  className = '',
  subtitle = 'Professional Network',
  showSubtitle = true,
  linkToHome = true,
  size = 'header',
  tone = 'on-light',
}) {
  const content = (
    <>
      <div className={`logo__mark logo__mark--${size}`}>
        <img
          src={LOGO_ASSETS[tone] ?? LOGO_ASSETS['on-light']}
          alt="Upper Room Church of God in Christ logo"
          className="logo__image"
        />
      </div>
      {showSubtitle && subtitle && (
        <span className={`logo__subtitle logo__subtitle--${size} logo__subtitle--${tone}`}>
          {subtitle}
        </span>
      )}
    </>
  )

  if (linkToHome) {
    return (
      <Link to="/" className={`logo logo--${size} logo--${tone} ${className}`.trim()}>
        {content}
      </Link>
    )
  }

  return <div className={`logo logo--${size} logo--${tone} ${className}`.trim()}>{content}</div>
}
