import { useState } from 'react'
import { useNetwork } from '../context/NetworkContext'
import { hasFormspree, notifyCoordinatorOfContact } from '../lib/notifyCoordinator'
import './ContactRequestModal.css'

const REQUEST_TYPES = [
  { value: 'general', label: 'General inquiry' },
  { value: 'hire', label: 'Hiring / project work' },
  { value: 'freelance', label: 'Freelance opportunity' },
  { value: 'mentoring', label: 'Mentorship request' },
]

export default function ContactRequestModal({ member, onClose }) {
  const { saveContactRequest } = useNetwork()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    requestType: 'general',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [notifyInfo, setNotifyInfo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.')
      return
    }

    setBusy(true)
    setError('')

    const contact = saveContactRequest({
      memberId: member.id,
      memberName: member.name,
      ...form,
    })

    const notify = await notifyCoordinatorOfContact({
      ...contact,
      memberId: member.id,
      memberName: member.name,
    })
    setNotifyInfo(notify)
    if (notify.channel === 'mailto' && notify.href) {
      window.location.href = notify.href
    }

    setSubmitted(true)
    setBusy(false)
  }

  const emailed = notifyInfo?.channel === 'formspree'

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="contact-modal-title"
        aria-modal="true"
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {submitted ? (
          <div className="modal__success">
            <h2 id="contact-modal-title">Request saved</h2>
            <p>
              Your message to <strong>{member.name}</strong> has been saved for the network coordinator.
              {emailed
                ? ' They have also been notified by email.'
                : hasFormspree()
                  ? ''
                  : ' If an email draft opened, please send it so they are notified right away.'}
            </p>
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id="contact-modal-title">Request an introduction</h2>
            <p className="modal__lead">
              Connect with <strong>{member.name}</strong> through the Upper Room network.
              Your contact details are shared only with network coordinators.
            </p>
            <form onSubmit={handleSubmit} className="contact-form">
              {error && <p className="form-error" role="alert">{error}</p>}
              <label>
                Your name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone <span className="optional">(optional)</span>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} />
              </label>
              <label>
                Request type
                <select name="requestType" value={form.requestType} onChange={handleChange}>
                  {REQUEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder={`Tell ${member.name.split(' ')[0]} a bit about what you're looking for...`}
                  required
                />
              </label>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={busy}>
                  {busy ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
