import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdminAsync } from '../../lib/adminAuth'
import { isRemoteConfigured, probeRemote, remoteVerifyAdmin } from '../../lib/remoteStore'
import Logo from '../../components/Logo'
import './admin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await probeRemote()
      const ok = await loginAdminAsync(
        password,
        isRemoteConfigured() ? remoteVerifyAdmin : undefined,
      )
      if (ok) {
        navigate('/admin')
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Incorrect password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <Logo size="admin" tone="on-light" linkToHome={false} showSubtitle={false} className="admin-login__logo" />
        <h1>Admin sign in</h1>
        <p>Upper Room COGIC Network coordinator access</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
