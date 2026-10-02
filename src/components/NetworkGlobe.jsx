import { useEffect, useRef } from 'react'
import './NetworkGlobe.css'

const GOLD = [196, 163, 90]
const NAVY = [12, 39, 72]
const IVORY = [244, 241, 234]
const TILT = -0.22
const LAND_SAMPLES = 32000
const GRID_MERIDIANS = 24
const GRID_PARALLELS = 11

function latLngToVector(lat, lng) {
  const phi = (lat * Math.PI) / 180
  const lambda = (lng * Math.PI) / 180
  return {
    x: Math.cos(phi) * Math.sin(lambda),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.cos(lambda),
  }
}

function rotateY(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  }
}

function rotateX(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

function rotateZ(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  }
}

function rotatePoint(point, rotX, rotY) {
  return rotateZ(rotateX(rotateY(point, rotY), rotX), TILT)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function isLandRgb(r, g, b) {
  if (r + g + b < 36) return false
  return b - (r + g) * 0.5 < 22
}

function sampleLandPoints(imageData, width, height) {
  const data = imageData.data
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < LAND_SAMPLES; i += 1) {
    const t = i / (LAND_SAMPLES - 1)
    const y = 1 - t * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius
    const lat = Math.asin(Math.max(-1, Math.min(1, y)))
    const lng = Math.atan2(x, z)
    const u = (lng + Math.PI) / (Math.PI * 2)
    const v = (Math.PI / 2 - lat) / Math.PI
    const px = Math.min(width - 1, Math.max(0, Math.floor(u * width)))
    const py = Math.min(height - 1, Math.max(0, Math.floor(v * height)))
    const idx = (py * width + px) * 4
    if (!isLandRgb(data[idx], data[idx + 1], data[idx + 2])) continue
    points.push({ x, y, z })
  }
  return points
}

function makeLatLngLine(latStart, latEnd, lngStart, lngEnd, steps) {
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    pts.push(latLngToVector(
      latStart + (latEnd - latStart) * t,
      lngStart + (lngEnd - lngStart) * t,
    ))
  }
  return pts
}

function makeGreatCircle(normal, steps = 96) {
  const n = Math.hypot(normal.x, normal.y, normal.z) || 1
  const nx = normal.x / n
  const ny = normal.y / n
  const nz = normal.z / n
  const ref = Math.abs(ny) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
  let ux = ref.y * nz - ref.z * ny
  let uy = ref.z * nx - ref.x * nz
  let uz = ref.x * ny - ref.y * nx
  const ul = Math.hypot(ux, uy, uz) || 1
  ux /= ul
  uy /= ul
  uz /= ul
  const vx = ny * uz - nz * uy
  const vy = nz * ux - nx * uz
  const vz = nx * uy - ny * ux
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    pts.push({ x: ux * c + vx * s, y: uy * c + vy * s, z: uz * c + vz * s })
  }
  return pts
}

function buildGrid() {
  const lines = []
  for (let i = 0; i < GRID_MERIDIANS; i += 1) {
    const lng = -180 + (360 / GRID_MERIDIANS) * i
    lines.push({ pts: makeLatLngLine(-90, 90, lng, lng, 64), weight: 1 })
  }
  for (let i = 1; i <= GRID_PARALLELS; i += 1) {
    const lat = -90 + (180 / (GRID_PARALLELS + 1)) * i
    if (Math.abs(lat) < 4) continue
    lines.push({ pts: makeLatLngLine(lat, lat, -180, 180, 96), weight: 1 })
  }
  lines.push({ pts: makeLatLngLine(0, 0, -180, 180, 96), weight: 1.35 })
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI
    lines.push({ pts: makeGreatCircle({ x: Math.cos(a), y: 0, z: Math.sin(a) }), weight: 0.85 })
  }
  return lines
}

function liftArc(start, end, alt, steps = 28) {
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const bulge = (t - t * t) * alt * 4
    const x = start.x + (end.x - start.x) * t
    const y = start.y + (end.y - start.y) * t
    const z = start.z + (end.z - start.z) * t
    const len = Math.hypot(x, y, z) || 1
    const scale = 1 + bulge * 0.32
    pts.push({ x: (x / len) * scale, y: (y / len) * scale, z: (z / len) * scale })
  }
  return pts
}

function buildArcs(states) {
  if (states.length < 2) return []
  const arcs = []
  const count = Math.min(states.length, 10)
  for (let i = 0; i < count; i += 1) {
    const a = states[i]
    const b = states[(i + 1) % count]
    arcs.push({
      pts: liftArc(latLngToVector(a.lat, a.lng), latLngToVector(b.lat, b.lng), 0.22 + (i % 3) * 0.08),
      from: a.code,
      to: b.code,
    })
  }
  for (let i = 0; i < count; i += 2) {
    const a = states[i]
    const b = states[(i + 3) % count]
    if (!a || !b || a.code === b.code) continue
    arcs.push({
      pts: liftArc(latLngToVector(a.lat, a.lng), latLngToVector(b.lat, b.lng), 0.38),
      from: a.code,
      to: b.code,
    })
  }
  return arcs.slice(0, 14)
}

function rgb(color, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export default function NetworkGlobe({ states, selectedCode, onSelect }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const selectedRef = useRef(selectedCode)
  const statesRef = useRef(states)
  const onSelectRef = useRef(onSelect)

  selectedRef.current = selectedCode
  statesRef.current = states
  onSelectRef.current = onSelect

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d', { alpha: true })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const grid = buildGrid()
    const landCanvas = document.createElement('canvas')

    let landPoints = []
    let networkArcs = []
    let arcsKey = ''
    let width = 0
    let height = 0
    let dpr = 1
    let radius = 0
    let cx = 0
    let cy = 0
    let rotX = 0.45
    let rotY = 1.4
    let targetX = 0.45
    let targetY = 1.4
    let dragging = false
    let dragMoved = false
    let lastPointer = { x: 0, y: 0 }
    let hoverCode = null
    let raf = 0
    const projected = []
    let cancelled = false

    const resize = () => {
      const bounds = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(320, Math.floor(bounds.width))
      height = Math.max(320, Math.floor(bounds.height))
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width, height) * 0.5
      cx = width * 0.5
      cy = height * 0.5
    }

    const pointState = (state) => {
      targetX = (state.lat * Math.PI) / 180
      targetY = -(state.lng * Math.PI) / 180
    }

    const project = (vector) => {
      const rotated = rotatePoint(vector, rotX, rotY)
      return {
        x: cx + rotated.x * radius,
        y: cy - rotated.y * radius,
        z: rotated.z,
      }
    }

    const strokeLine = (pts, color, lineWidth) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      let drawing = false
      pts.forEach((point) => {
        const p = project(point)
        if (p.z < 0.04) {
          drawing = false
          return
        }
        if (!drawing) {
          ctx.moveTo(p.x, p.y)
          drawing = true
        } else {
          ctx.lineTo(p.x, p.y)
        }
      })
      ctx.stroke()
    }

    const draw = (now) => {
      const selected = statesRef.current.find((state) => state.code === selectedRef.current)
      if (selected && !dragging) pointState(selected)

      if (!reduceMotion.matches && !dragging) {
        rotX += (targetX - rotX) * 0.045
        rotY += (targetY - rotY) * 0.045
        if (selected) rotY += Math.sin(now * 0.00035) * 0.0012
        else rotY += 0.0018
      } else if (selected && !dragging) {
        rotX = targetX
        rotY = targetY
      }

      ctx.clearRect(0, 0, width, height)

      const glowPulse = reduceMotion.matches ? 1 : 0.88 + Math.sin(now * 0.0014) * 0.12

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      grid.forEach((line) => {
        strokeLine(line.pts, 'rgba(196, 163, 90, 0.28)', line.weight)
      })

      const dot = Math.max(1.35, radius * 0.0072)
      const buckets = [[], [], [], [], [], [], [], []]
      landPoints.forEach((point) => {
        const p = project(point)
        if (p.z < 0.06) return
        buckets[Math.min(7, Math.max(0, Math.floor(p.z * 8)))].push(p)
      })
      buckets.forEach((list, bucket) => {
        const lit = 0.38 + (bucket / 7) * 0.72
        ctx.fillStyle = `rgb(${Math.round(GOLD[0] * lit)},${Math.round(GOLD[1] * lit)},${Math.round(GOLD[2] * lit)})`
        list.forEach((p) => {
          const size = dot * (0.72 + p.z * 0.5)
          ctx.fillRect(p.x - size * 0.5, p.y - size * 0.5, size, size)
        })
      })
      ctx.restore()

      ctx.beginPath()
      ctx.arc(cx, cy, radius + 0.6, 0, Math.PI * 2)
      ctx.strokeStyle = rgb(GOLD, 0.38 + glowPulse * 0.16)
      ctx.lineWidth = 1.35
      ctx.stroke()

      const nextArcsKey = statesRef.current.map((state) => state.code).join(',')
      if (nextArcsKey !== arcsKey) {
        networkArcs = buildArcs(statesRef.current)
        arcsKey = nextArcsKey
      }
      const selectedCodeNow = selectedRef.current
      networkArcs.forEach((arc, index) => {
        const active = arc.from === selectedCodeNow || arc.to === selectedCodeNow
        strokeLine(
          arc.pts,
          rgb(GOLD, active ? 0.55 : 0.22),
          active ? 1.35 : 0.9,
        )
        if (reduceMotion.matches) return
        const travel = ((now * 0.00035) + index * 0.12) % 1
        const head = Math.min(arc.pts.length - 1, Math.floor(travel * arc.pts.length))
        const p = project(arc.pts[head])
        if (p.z < 0.08) return
        ctx.beginPath()
        ctx.fillStyle = rgb(IVORY, 0.7)
        ctx.arc(p.x, p.y, active ? 2.1 : 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      projected.length = 0
      const pins = statesRef.current.map((state) => {
        const p = project(latLngToVector(state.lat, state.lng))
        const item = { ...p, state }
        projected.push(item)
        return item
      }).filter((item) => item.z >= 0.12)
        .sort((a, b) => a.z - b.z)

      pins.forEach((item) => {
        const { state } = item
        const active = state.code === selectedRef.current
        const hovered = state.code === hoverCode
        const markerR = active ? 4.2 : hovered ? 3.6 : 2.7

        if (active || hovered) {
          ctx.beginPath()
          ctx.strokeStyle = active
            ? rgb(GOLD, 0.55 + Math.sin(now * 0.005) * 0.12)
            : rgb(GOLD, 0.55)
          ctx.lineWidth = 1.15
          ctx.arc(item.x, item.y, markerR + 4.5, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.fillStyle = rgb(NAVY, 0.7)
        ctx.arc(item.x, item.y, markerR + 1.15, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = active || hovered ? rgb(IVORY) : rgb(GOLD)
        ctx.arc(item.x, item.y, markerR, 0, Math.PI * 2)
        ctx.fill()
      })

      pins.filter((item) => (
        item.state.code === selectedRef.current || item.state.code === hoverCode
      )).forEach((item) => {
        const active = item.state.code === selectedRef.current
        ctx.font = `600 ${active ? 11 : 10}px "Source Sans 3", system-ui, sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(244, 241, 234, 0.9)'
        ctx.shadowBlur = 6
        ctx.fillStyle = rgb(NAVY)
        ctx.fillText(item.state.code, item.x + 9, item.y)
        ctx.shadowBlur = 0
      })

      raf = requestAnimationFrame(draw)
    }

    const HIT_RADIUS = 18
    const hitTest = (x, y) => {
      let best = null
      let bestScore = Infinity
      projected.forEach((item) => {
        if (item.z < 0.12) return
        const dist = Math.hypot(item.x - x, item.y - y)
        if (dist > HIT_RADIUS) return
        const score = dist - item.z * 6
        if (score < bestScore) {
          best = item.state
          bestScore = score
        }
      })
      return best
    }

    const localPoint = (event) => {
      const bounds = canvas.getBoundingClientRect()
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }
    }

    const onPointerDown = (event) => {
      dragging = true
      dragMoved = false
      lastPointer = localPoint(event)
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        /* synthetic events may not own a pointer */
      }
    }

    const onPointerMove = (event) => {
      const next = localPoint(event)
      const hit = hitTest(next.x, next.y)
      hoverCode = hit?.code || null
      canvas.style.cursor = hit || dragging ? 'pointer' : 'grab'
      if (!dragging) return
      const dx = next.x - lastPointer.x
      const dy = next.y - lastPointer.y
      if (Math.hypot(dx, dy) > 3) dragMoved = true
      rotY += dx * 0.005
      rotX = Math.max(-0.95, Math.min(0.95, rotX + dy * 0.004))
      lastPointer = next
    }

    const onPointerUp = (event) => {
      const next = localPoint(event)
      dragging = false
      canvas.style.cursor = 'grab'
      if (dragMoved) return
      const hit = hitTest(next.x, next.y)
      if (hit) onSelectRef.current?.(hit.code)
    }

    const onPointerLeave = () => {
      dragging = false
      hoverCode = null
    }

    resize()
    const selected = statesRef.current.find((state) => state.code === selectedRef.current)
    if (selected) {
      pointState(selected)
      rotX = targetX
      rotY = targetY
    }

    raf = requestAnimationFrame(draw)
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)

    loadImage('/images/earth-day.jpg').then((image) => {
      if (cancelled) return
      landCanvas.width = image.width
      landCanvas.height = image.height
      const landCtx = landCanvas.getContext('2d', { willReadFrequently: true })
      landCtx.drawImage(image, 0, 0)
      const data = landCtx.getImageData(0, 0, image.width, image.height)
      landPoints = sampleLandPoints(data, image.width, image.height)
    }).catch(() => {})

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className="network-globe">
      <div className="network-globe__glow" aria-hidden="true" />
      <canvas ref={canvasRef} className="network-globe__canvas" aria-label="Network globe of member states" />
    </div>
  )
}
