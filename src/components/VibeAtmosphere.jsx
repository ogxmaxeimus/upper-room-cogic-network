import { useEffect } from 'react'
import './VibeAtmosphere.css'

export default function VibeAtmosphere() {
  useEffect(() => {
    const root = document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    root.style.setProperty('--mx', '52%')
    root.style.setProperty('--my', '24%')
    root.style.setProperty('--sy', '0')

    let moveRaf = 0
    let scrollRaf = 0
    let nextX = 52
    let nextY = 24

    const onMove = (event) => {
      if (reduceMotion.matches) return
      const width = window.innerWidth || 1
      const height = window.innerHeight || 1
      nextX = (event.clientX / width) * 100
      nextY = (event.clientY / height) * 100
      if (moveRaf) return
      moveRaf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${nextX.toFixed(2)}%`)
        root.style.setProperty('--my', `${nextY.toFixed(2)}%`)
        moveRaf = 0
      })
    }

    const onScroll = () => {
      if (reduceMotion.matches) return
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        root.style.setProperty('--sy', String(window.scrollY || 0))
        scrollRaf = 0
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      if (moveRaf) cancelAnimationFrame(moveRaf)
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
    }
  }, [])

  return (
    <div className="vibe" aria-hidden="true">
      <div className="vibe__spotlight" />
      <div className="vibe__field">
        <span className="vibe__orb vibe__orb--gold" />
        <span className="vibe__orb vibe__orb--ember" />
        <span className="vibe__orb vibe__orb--cream" />
      </div>
      <div className="vibe__grain" />
    </div>
  )
}
