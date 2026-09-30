import { useRef, useState } from 'react'
import { processProfileImage } from '../lib/imageUpload'
import './ProfilePhotoUpload.css'

export default function ProfilePhotoUpload({
  value,
  onChange,
  label = 'Profile photo',
  optionalHint = 'JPG, PNG, or WebP · max 5 MB',
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const dataUrl = await processProfileImage(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
    setError('')
  }

  return (
    <div className="photo-upload">
      <span className="photo-upload__label">{label}</span>
      {optionalHint && <span className="photo-upload__hint">{optionalHint}</span>}

      {value ? (
        <div className="photo-upload__preview">
          <img src={value} alt="Profile preview" />
          <div className="photo-upload__actions">
            <button type="button" className="btn btn--secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? 'Processing…' : 'Replace photo'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleRemove} disabled={busy}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="photo-upload__dropzone"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <span className="photo-upload__dropzone-title">{busy ? 'Processing photo…' : 'Upload a photo'}</span>
          <span className="photo-upload__dropzone-sub">Click to choose from your device</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="photo-upload__input"
        onChange={handleFile}
      />

      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
