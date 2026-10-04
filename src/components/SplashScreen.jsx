import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import './SplashScreen.css'

const SPLASH_MIN_MS = 1100
const SPLASH_FADE_MS = 480
const REDUCED_MIN_MS = 80
const REDUCED_FADE_MS = 160

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function SplashScreen({ dataReady, onFinished }) {
  const [minElapsed, setMinElapsed] = useState(false)
  const [fading, setFading] = useState(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const timer = setTimeout(() => setMinElapsed(true), reduced ? REDUCED_MIN_MS : SPLASH_MIN_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!dataReady || !minElapsed || fading) return
    const reduced = prefersReducedMotion()
    setFading(true)
    const timer = setTimeout(() => {
      if (finishedRef.current) return
      finishedRef.current = true
      onFinished()
    }, reduced ? REDUCED_FADE_MS : SPLASH_FADE_MS)
    return () => clearTimeout(timer)
  }, [dataReady, minElapsed, fading, onFinished])

  return (
    <div
      className={`app-splash${fading ? ' app-splash--fading' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!fading}
    >
      <span className="sr-only">Loading</span>
      <Logo
        size="splash"
        tone="on-light"
        linkToHome={false}
        showSubtitle={false}
        className="app-splash__logo"
      />
    </div>
  )
}
