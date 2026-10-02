import { useEffect, useRef } from 'react'

const SEED = 'upper-room'
const ROYAL = '26, 83, 152'
const ROYAL_GLOW = '92, 148, 204'

function hash4096(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return ((h >>> 0) / 4294967296) * 4096
}

function ranged(key, min, max) {
  return min + (hash4096(`${SEED}:terrain:${key}`) / 4096) * (max - min)
}

const HILLS = {
  a: {
    x: ranged('a:x', -4.6, -1.4),
    y: ranged('a:depth', 0.2, 2.4),
    z: ranged('a:height', 0.65, 1.55),
    w: ranged('a:width', 0.34, 0.74),
  },
  b: {
    x: ranged('b:x', 0, 3.8),
    y: ranged('b:depth', -0.5, 2.2),
    z: ranged('b:height', 0.55, 1.45),
    w: ranged('b:width', 0.36, 0.8),
  },
  c: {
    x: ranged('c:x', -2.6, 1.4),
    y: ranged('c:depth', -3.2, -1.1),
    z: ranged('c:height', 0.4, 1.2),
    w: ranged('c:width', 0.36, 0.72),
  },
  d: {
    x: ranged('d:x', 2.1, 5),
    y: ranged('d:depth', -3.7, -1.3),
    z: ranged('d:height', 0.4, 1.15),
    w: ranged('d:width', 0.35, 0.72),
  },
}

function terrainAt(px, py, t) {
  const ax = px - (HILLS.a.x + Math.sin(t) * 0.32)
  const ay = py - (HILLS.a.y + Math.cos(t * 0.8) * 0.25)
  const bx = px - (HILLS.b.x + Math.cos(t * 0.7) * 0.38)
  const by = py - (HILLS.b.y + Math.sin(t * 0.9) * 0.35)
  const cx = px - (HILLS.c.x + Math.sin(t * 0.6) * 0.3)
  const cy = py - HILLS.c.y
  const dx = px - HILLS.d.x
  const dy = py - (HILLS.d.y + Math.cos(t) * 0.25)

  const wax = HILLS.a.w
  const way = HILLS.a.w * 1.35
  const wbx = HILLS.b.w
  const wby = HILLS.b.w * 1.11
  const wcx = HILLS.c.w
  const wcy = HILLS.c.w * 1.4
  const wdx = HILLS.d.w
  const wdy = HILLS.d.w * 1.35

  const ha = HILLS.a.z * Math.exp(-((ax * wax) ** 2) - ((ay * way) ** 2))
  const hb = HILLS.b.z * Math.exp(-((bx * wbx) ** 2) - ((by * wby) ** 2))
  const hc = HILLS.c.z * Math.exp(-((cx * wcx) ** 2) - ((cy * wcy) ** 2))
  const hd = HILLS.d.z * Math.exp(-((dx * wdx) ** 2) - ((dy * wdy) ** 2))
  const detail =
    0.035 * Math.sin(px * 3.2 + py * 2.3 + t) +
    0.015 * Math.sin(px * 6.1 - py * 4.7 - t * 0.8) +
    0.1 * Math.sin(px * 0.85 + py * 1.2 - t)

  return ha + hb + hc + hd + detail
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function projectCell(col, row, cols, rows, field, t) {
  const uvx = cols <= 1 ? 0.5 : col / (cols - 1)
  const uvy = rows <= 1 ? 0.5 : row / (rows - 1)
  const px = (uvx - 0.5) * 9.2
  const py = (uvy - 0.5) * 6.4
  const height = terrainAt(px, py, t)
  const persp = 0.82 + uvy * 0.28
  const x = field.x + (uvx - 0.5) * 2 * field.halfW * persp
  const baseY = field.top + uvy * field.spanY
  const lift = height * field.maxLift * (0.55 + 0.45 * uvy)
  const y = baseY - lift
  const focus = 1 - smoothstep(0.08, 0.4, Math.abs(uvy - 0.56))
  return { x, y, depth: uvy, focus }
}

function strokePolyline(ctx, points, weights, width, color) {
  if (points.length < 4) return
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) {
    if (weights[i / 2] < 0.04) {
      ctx.moveTo(points[i], points[i + 1])
    } else {
      ctx.lineTo(points[i], points[i + 1])
    }
  }
  ctx.stroke()
}

export default function HeroWave() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let running = true
    let visible = true
    let start = performance.now()
    const size = {
      cols: 0,
      rows: 0,
      width: 0,
      height: 0,
      field: { x: 0, y: 0, halfW: 1, halfH: 1, top: 0, spanY: 1, maxLift: 1, bottom: 1 },
    }

    const resize = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth || canvas.clientWidth)
      const height = Math.max(1, parent?.clientHeight || canvas.clientHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      size.width = width
      size.height = height
      size.cols = Math.max(80, Math.min(140, Math.round(width / 9)))
      size.rows = Math.max(48, Math.min(80, Math.round(height / 8)))
      const top = height * 0.02
      const spanY = height * 0.96
      size.field = {
        x: width * 0.5,
        y: height * 0.48,
        halfW: width * 0.78,
        halfH: spanY * 0.5,
        top,
        spanY,
        maxLift: spanY * 0.2,
        bottom: top + spanY,
      }
    }

    const draw = (now) => {
      const { cols, rows, width, height, field } = size
      if (!cols || !rows) return
      const t = (reduced.matches ? 6.2 : (now - start) / 1000) * 0.075

      const grid = new Array(cols * rows)
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          grid[row * cols + col] = projectCell(col, row, cols, rows, field, t)
        }
      }

      ctx.clearRect(0, 0, width, height)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const wash = ctx.createRadialGradient(
        field.x,
        field.y,
        18,
        field.x,
        field.y,
        Math.max(field.halfW, field.halfH) * 1.05,
      )
      wash.addColorStop(0, `rgba(${ROYAL}, 0.022)`)
      wash.addColorStop(0.55, `rgba(${ROYAL}, 0.008)`)
      wash.addColorStop(1, `rgba(${ROYAL}, 0)`)
      ctx.fillStyle = wash
      ctx.fillRect(0, 0, width, height)

      const colsPts = Array.from({ length: cols }, () => [])
      const colsW = Array.from({ length: cols }, () => [])
      for (let col = 0; col < cols; col += 1) {
        for (let row = 0; row < rows; row += 1) {
          const p = grid[row * cols + col]
          const vis = 0.42 + p.depth * 0.58
          colsPts[col].push(p.x, p.y)
          colsW[col].push(vis)
        }
      }
      for (let col = 0; col < cols; col += 1) {
        strokePolyline(ctx, colsPts[col], colsW[col], 1.25, `rgba(${ROYAL_GLOW}, 0.035)`)
        strokePolyline(ctx, colsPts[col], colsW[col], 0.48, `rgba(${ROYAL}, 0.08)`)
      }

      for (let row = 0; row < rows; row += 1) {
        const pts = []
        const weights = []
        let focus = 0
        for (let col = 0; col < cols; col += 1) {
          const p = grid[row * cols + col]
          const vis = 0.42 + p.depth * 0.58
          pts.push(p.x, p.y)
          weights.push(vis)
          focus += p.focus
        }
        focus /= cols
        const defocus = 1 - focus
        const glowWidth = 1.7 + defocus * 1.8
        const lineWidth = 0.58 + focus * 0.4
        const energy = 0.5 + focus * 0.5
        strokePolyline(ctx, pts, weights, glowWidth, `rgba(${ROYAL_GLOW}, ${0.022 + energy * 0.032})`)
        strokePolyline(ctx, pts, weights, lineWidth, `rgba(${ROYAL}, ${0.095 + energy * 0.08})`)
      }

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      const well = ctx.createRadialGradient(
        width * 0.5,
        height * 0.34,
        Math.min(width, height) * 0.06,
        width * 0.5,
        height * 0.4,
        Math.min(width * 0.42, height * 0.52),
      )
      well.addColorStop(0, 'rgba(0, 0, 0, 0.82)')
      well.addColorStop(0.38, 'rgba(0, 0, 0, 0.48)')
      well.addColorStop(0.72, 'rgba(0, 0, 0, 0.16)')
      well.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = well
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
    }

    const tick = (now) => {
      if (!running) return
      if (visible) {
        draw(now)
        if (!reduced.matches) frame = requestAnimationFrame(tick)
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible && running && !reduced.matches) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(tick)
      }
    }, { threshold: 0.05 })
    observer.observe(canvas)

    const onResize = () => {
      resize()
      draw(performance.now())
    }

    resize()
    draw(start)
    if (!reduced.matches) frame = requestAnimationFrame(tick)
    window.addEventListener('resize', onResize)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero__wave" aria-hidden="true" />
}
