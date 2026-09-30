import { useEffect, useRef } from 'react'

export default function useVibePointer({ persist = false } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let targetX = 28
    let targetY = 24
    let curX = 28
    let curY = 24

    const write = (x, y) => {
      el.style.setProperty('--lx', `${x.toFixed(2)}%`)
      el.style.setProperty('--ly', `${y.toFixed(2)}%`)
      el.style.setProperty('--ldx', ((x / 50) - 1).toFixed(3))
      el.style.setProperty('--ldy', ((y / 50) - 1).toFixed(3))
    }

    const tick = () => {
      curX += (targetX - curX) * 0.16
      curY += (targetY - curY) * 0.16
      write(curX, curY)
      if (Math.abs(targetX - curX) > 0.04 || Math.abs(targetY - curY) > 0.04) {
        raf = requestAnimationFrame(tick)
      } else {
        write(targetX, targetY)
        raf = 0
      }
    }

    const chase = () => {
      if (raf) return
      raf = requestAnimationFrame(tick)
    }

    const onMove = (event) => {
      if (reduceMotion.matches) return
      const rect = el.getBoundingClientRect()
      const width = rect.width || 1
      const height = rect.height || 1
      targetX = ((event.clientX - rect.left) / width) * 100
      targetY = ((event.clientY - rect.top) / height) * 100
      chase()
    }

    const onLeave = () => {
      if (persist || reduceMotion.matches) return
      targetX = 28
      targetY = 24
      chase()
    }

    write(curX, curY)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [persist])

  return ref
}
