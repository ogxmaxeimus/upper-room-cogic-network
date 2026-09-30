import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist in the network directory.</p>
      <Link to="/" className="btn btn--primary">Back to directory</Link>
    </div>
  )
}
