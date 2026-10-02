import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const target = id ? document.getElementById(id) : null
      if (target) {
        target.scrollIntoView()
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])

  return null
}
