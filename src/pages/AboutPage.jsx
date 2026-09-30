import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { STATEMENT_OF_FAITH, FAITH_SOURCE_URL } from '../data/about'
import './AboutPage.css'

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <Logo size="hero" tone="on-light" linkToHome={false} showSubtitle={true} />
        <h1>About the Professional Network</h1>
        <p className="about-hero__lead">
          A faith rooted directory connecting members of Upper Room COGIC through
          professional excellence, trusted fellowship, and service to one another.
        </p>
      </section>

      <section className="about-section">
        <h2>Our purpose</h2>
        <p>
          The Upper Room COGIC Professional Network exists to help members of our church
          family discover one another, share their gifts, and support one another in every
          sphere of life. We believe that calling extends beyond the sanctuary into the
          workplace, the marketplace, and the community. When believers walk in excellence
          and integrity in their professions, the whole body is strengthened.
        </p>
        <p>
          This directory is a practical extension of our fellowship. It helps members find
          mentors, collaborators, and skilled professionals within a community they already
          trust. It gives leaders a way to highlight the talent in our congregation and
          create pathways for growth, opportunity, and mutual support.
        </p>
      </section>

      <section className="about-section about-section--muted">
        <h2>What we believe this network represents</h2>
        <div className="about-values">
          <article>
            <h3>Faith and excellence</h3>
            <p>
              We encourage members to represent Christ with dignity in their work.
              Profiles reflect both professional competence and commitment to the values
              of our church.
            </p>
          </article>
          <article>
            <h3>Community and stewardship</h3>
            <p>
              The gifts within our congregation are meant to be shared. This network
              stewards those gifts by making them visible, accessible, and accountable
              to leadership oversight.
            </p>
          </article>
          <article>
            <h3>Mentorship and empowerment</h3>
            <p>
              Young professionals, entrepreneurs, and tradespeople in our church
              deserve access to guidance from those who have gone before them. The
              network creates space for mentoring, hiring, and meaningful connection.
            </p>
          </article>
          <article>
            <h3>Trust and accountability</h3>
            <p>
              Members apply to join. Leadership reviews each application before profiles
              are published. Verified members and introduction requests help protect
              privacy while fostering genuine connection.
            </p>
          </article>
        </div>
      </section>

      <section className="about-section">
        <h2>How it serves Upper Room</h2>
        <ul className="about-list">
          <li>Helps families and members find trusted professionals within the church</li>
          <li>Supports the Men&apos;s Ministry and broader ministries in building fellowship across careers</li>
          <li>Creates visibility for entrepreneurs, creatives, healthcare workers, tradespeople, and more</li>
          <li>Honors the calling of every member to serve God through their work</li>
          <li>Provides a lasting resource that grows as our congregation grows</li>
        </ul>
        <p>
          Whether you are seeking a mentor, offering your skills, or looking for a
          believer led business or service, this network exists to help you connect with
          purpose.
        </p>
      </section>

      <section className="about-section about-faith">
        <div className="about-faith__header">
          <h2>Statement of faith</h2>
          <p>
            The Upper Room COGIC Professional Network is rooted in the beliefs of Upper
            Room Church of God in Christ. Our faith is the foundation for how we live,
            serve, and relate to one another.
          </p>
          <a href={FAITH_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="about-faith__source">
            Read on upperroomgospel.org →
          </a>
        </div>
        <div className="about-faith__grid">
          {STATEMENT_OF_FAITH.map((item) => (
            <article key={item.title} className="faith-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <p className="about-faith__amen">Amen.</p>
      </section>

      <section className="about-cta">
        <div>
          <h2>Become part of the network</h2>
          <p>
            If you are a member of Upper Room COGIC and would like to share your
            professional gifts with our community, we invite you to apply.
          </p>
        </div>
        <div className="about-cta__actions">
          <Link to="/join" className="btn btn--primary">Apply to join</Link>
          <Link to="/search" className="btn btn--secondary">Browse members</Link>
        </div>
      </section>
    </div>
  )
}
