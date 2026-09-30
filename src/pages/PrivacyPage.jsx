import { Link } from 'react-router-dom'
import { CHURCH_NAME, CHURCH_URL, COORDINATOR_EMAIL } from '../data/site'
import './PrivacyPage.css'

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <header className="privacy-page__header">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </header>

      <section className="privacy-section">
        <h2>Overview</h2>
        <p>
          The Upper Room COGIC Professional Network (&ldquo;the Network&rdquo;) is operated by {CHURCH_NAME}.
          This policy explains what information we collect, how it is used, and your choices regarding
          your personal data when you browse, apply to join, or request an introduction through the directory.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Join applications:</strong> name, email, phone, location, professional details, bio, links, and availability preferences you submit on the join form.</li>
          <li><strong>Introduction requests:</strong> your name, email, message, and the member you wish to contact.</li>
          <li><strong>Published profiles:</strong> professional information approved for public display. Email and phone are not shown publicly on member profiles.</li>
          <li><strong>Coordinator access:</strong> administrative sign-in sessions on devices used by authorized church coordinators.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>How we use information</h2>
        <ul>
          <li>Review membership applications before publishing profiles to the directory.</li>
          <li>Help members connect through mediated introduction requests.</li>
          <li>Maintain and improve the directory for the Upper Room congregation.</li>
          <li>Communicate with applicants about approval, rejection, or profile updates.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>Who can see your information</h2>
        <p>
          Approved profile information is visible to anyone who visits the public directory.
          Application details and introduction requests are visible only to authorized coordinators
          through the admin tools (and may be stored on shared hosting so coordinators can review
          from more than one device). We do not sell personal information to third parties.
          Email notification providers (such as Formspree) may process join and introduction messages
          when that feature is enabled.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Directory disclaimer</h2>
        <p>
          Listings in this directory reflect self-reported professional information reviewed by church
          coordinators. {CHURCH_NAME} does not endorse specific services, guarantee outcomes, or assume
          liability for work performed by listed members. Members are independent professionals and
          should be evaluated by users of the directory.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Data retention and removal</h2>
        <p>
          Published profiles remain listed until you request removal or a coordinator archives your listing.
          To update or remove your profile, contact{' '}
          <a href={`mailto:${COORDINATOR_EMAIL}`}>{COORDINATOR_EMAIL}</a>.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Contact</h2>
        <p>
          Questions about this policy or your data may be directed to{' '}
          <a href={`mailto:${COORDINATOR_EMAIL}`}>{COORDINATOR_EMAIL}</a> or through{' '}
          <a href={CHURCH_URL} target="_blank" rel="noreferrer">{CHURCH_URL.replace('https://', '')}</a>.
        </p>
      </section>

      <p className="privacy-page__back">
        <Link to="/">← Back to directory</Link>
      </p>
    </div>
  )
}
