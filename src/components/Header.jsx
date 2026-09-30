import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Logo size="header" tone="on-dark" className="site-header__brand" />
        <nav className="site-header__nav" aria-label="Main">
          <Link to="/about">About</Link>
          <button type="button" onClick={() => navigate('/search')}>Search</button>
          <button type="button" onClick={() => navigate('/cities')}>Cities</button>
          <Link to="/join" className="site-header__join">Join</Link>
        </nav>
      </div>
    </header>
  )
}
