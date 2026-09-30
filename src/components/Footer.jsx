import { Link } from 'react-router-dom'
import Logo from './Logo'
import { CHURCH_URL, COORDINATOR_EMAIL } from '../data/site'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo size="footer" tone="on-light" linkToHome={false} showSubtitle={true} />
          <p className="site-footer__tagline">
            Connecting faith, talent, and opportunity across the Upper Room community.
          </p>
          <p className="site-footer__church">
            <a href={CHURCH_URL} target="_blank" rel="noreferrer">
              Visit upperroomgospel.org →
            </a>
          </p>
        </div>

        <nav className="site-footer__column" aria-label="Explore">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/search">Search members</Link></li>
            <li><Link to="/cities">Network globe</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </nav>

        <nav className="site-footer__column" aria-label="Get involved">
          <h2>Get involved</h2>
          <ul>
            <li><Link to="/join">Join the network</Link></li>
            <li><Link to="/admin/login">Coordinator sign in</Link></li>
            <li>
              <a href={`mailto:${COORDINATOR_EMAIL}`}>
                Questions? {COORDINATOR_EMAIL}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} Upper Room Church of God in Christ. All rights reserved.</p>
      </div>
    </footer>
  )
}
