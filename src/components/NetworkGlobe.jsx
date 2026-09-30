import { useEffect, useRef } from 'react'
import './NetworkGlobe.css'

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

function rotatePoint(point, rotX, rotY) {
  return rotateX(rotateY(point, rotY), rotX)
}

function inverseRotate(point, rotX, rotY) {
  return rotateY(rotateX(point, -rotX), -rotY)
}

function extractRings(geojson) {
  const rings = []
  const addRing = (coords, name) => {
    const pts = []
    const stride = coords.length > 180 ? 2 : 1
    for (let i = 0; i < coords.length; i += stride) {
      const [lng, lat] = coords[i]
      pts.push(latLngToVector(lat, lng))
    }
    if (pts.length > 2) rings.push({ name, pts })
  }

  geojson.features.forEach((feature) => {
    const name = feature.properties?.name || ''
    const { type, coordinates } = feature.geometry || {}
    if (type === 'Polygon') coordinates.forEach((ring) => addRing(ring, name))
    if (type === 'MultiPolygon') {
      coordinates.forEach((polygon) => polygon.forEach((ring) => addRing(ring, name)))
    }
  })
  return rings
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
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
    const landCanvas = document.createElement('canvas')
    const globeCanvas = document.createElement('canvas')
    const globeCtx = globeCanvas.getContext('2d')

    let landPixels = null
    let landWidth = 0
    let landHeight = 0
    let rings = []
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
    let pointer = { x: 0.5, y: 0.42 }
    let hoverCode = null
    let raf = 0
    let time = 0
    let lastPaintKey = ''
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
      radius = Math.min(width, height) * 0.38
      cx = width * 0.5
      cy = height * 0.5
      lastPaintKey = ''
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

    const sampleLand = (u, v) => {
      const x = Math.min(landWidth - 1, Math.max(0, Math.floor(u * landWidth)))
      const y = Math.min(landHeight - 1, Math.max(0, Math.floor(v * landHeight)))
      const i = (y * landWidth + x) * 4
      return landPixels.subarray(i, i + 3)
    }

    const paintGlobe = () => {
      if (!landPixels || !width) return
      globeCanvas.width = width
      globeCanvas.height = height
      const image = globeCtx.createImageData(width, height)
      const out = image.data
      const step = radius > 210 ? 2 : 1
      const minX = Math.max(0, Math.floor(cx - radius))
      const maxX = Math.min(width, Math.ceil(cx + radius))
      const minY = Math.max(0, Math.floor(cy - radius))
      const maxY = Math.min(height, Math.ceil(cy + radius))
      const lightX = (pointer.x - 0.5) * 0.9
      const lightY = (pointer.y - 0.5) * 0.7

      for (let py = minY; py < maxY; py += step) {
        for (let px = minX; px < maxX; px += step) {
          const nx = (px - cx) / radius
          const ny = (cy - py) / radius
          const rr = nx * nx + ny * ny
          if (rr > 1) continue
          const nz = Math.sqrt(1 - rr)
          const world = inverseRotate({ x: nx, y: ny, z: nz }, rotX, rotY)
          const lat = Math.asin(Math.max(-1, Math.min(1, world.y)))
          const lng = Math.atan2(world.x, world.z)
          const u = (lng + Math.PI) / (Math.PI * 2)
          const v = (Math.PI / 2 - lat) / Math.PI
          const rgb = sampleLand(u, v)
          const light = 0.42 + nz * 0.58 + Math.max(0, 1 - Math.hypot(nx - lightX, ny - lightY)) * 0.12
          const r = Math.min(255, rgb[0] * light)
          const g = Math.min(255, rgb[1] * light)
          const b = Math.min(255, rgb[2] * light)
          for (let dy = 0; dy < step; dy += 1) {
            for (let dx = 0; dx < step; dx += 1) {
              if (px + dx >= width || py + dy >= height) continue
              const idx = ((py + dy) * width + (px + dx)) * 4
              out[idx] = r
              out[idx + 1] = g
              out[idx + 2] = b
              out[idx + 3] = 255
            }
          }
        }
      }
      globeCtx.putImageData(image, 0, 0)
    }

    const drawBorders = () => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      ctx.lineJoin = 'round'
      rings.forEach((ring) => {
        const highlight = ring.name === 'USA'
        ctx.beginPath()
        let drawing = false
        ring.pts.forEach((point) => {
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
        ctx.strokeStyle = highlight ? 'rgba(196, 163, 90, 0.78)' : 'rgba(228, 237, 246, 0.38)'
        ctx.lineWidth = highlight ? 1.15 : 0.7
        ctx.stroke()
      })
      ctx.restore()
    }

    const draw = (now) => {
      const selected = statesRef.current.find((state) => state.code === selectedRef.current)
      if (selected && !dragging) pointState(selected)

      if (!reduceMotion.matches && !dragging) {
        rotX += (targetX - rotX) * 0.045
        rotY += (targetY - rotY) * 0.045
        if (selected) rotY += Math.sin(now * 0.00035) * 0.0012
        else rotY += 0.0016
      } else if (selected && !dragging) {
        rotX = targetX
        rotY = targetY
      }

      time = now
      ctx.clearRect(0, 0, width, height)

      const glowPulse = reduceMotion.matches ? 1 : 0.85 + Math.sin(now * 0.0016) * 0.15
      const aura = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius * 1.72)
      aura.addColorStop(0, `rgba(196, 163, 90, ${0.42 * glowPulse})`)
      aura.addColorStop(0.28, `rgba(26, 83, 152, ${0.32 * glowPulse})`)
      aura.addColorStop(0.55, `rgba(12, 39, 72, ${0.18 * glowPulse})`)
      aura.addColorStop(1, 'rgba(12, 39, 72, 0)')
      ctx.fillStyle = aura
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.72, 0, Math.PI * 2)
      ctx.fill()

      const paintKey = `${rotX.toFixed(3)}|${rotY.toFixed(3)}|${width}|${height}|${pointer.x.toFixed(2)}|${pointer.y.toFixed(2)}`
      if (paintKey !== lastPaintKey) {
        paintGlobe()
        lastPaintKey = paintKey
      }

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      if (landPixels) ctx.drawImage(globeCanvas, 0, 0)
      else {
        ctx.fillStyle = '#0c2748'
        ctx.fill()
      }
      ctx.restore()

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      const limb = ctx.createRadialGradient(cx, cy, radius * 0.72, cx, cy, radius)
      limb.addColorStop(0, 'rgba(0, 0, 0, 0)')
      limb.addColorStop(1, 'rgba(7, 24, 44, 0.42)')
      ctx.fillStyle = limb
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(196, 163, 90, ${0.45 + glowPulse * 0.2})`
      ctx.lineWidth = 3
      ctx.stroke()

      if (rings.length) drawBorders()

      const spec = ctx.createRadialGradient(
        cx - radius * 0.32 + (pointer.x - 0.5) * 36,
        cy - radius * 0.4 + (pointer.y - 0.5) * 28,
        6,
        cx,
        cy,
        radius,
      )
      spec.addColorStop(0, 'rgba(255, 248, 235, 0.2)')
      spec.addColorStop(0.22, 'rgba(255, 248, 235, 0.05)')
      spec.addColorStop(1, 'rgba(255, 248, 235, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = spec
      ctx.fill()

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
        const markerR = active ? 4.2 : hovered ? 3.6 : 2.8

        if (active || hovered) {
          ctx.beginPath()
          ctx.strokeStyle = active
            ? `rgba(196, 163, 90, ${0.55 + Math.sin(time * 0.005) * 0.12})`
            : 'rgba(228, 237, 246, 0.45)'
          ctx.lineWidth = 1.15
          ctx.arc(item.x, item.y, markerR + 4.5, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.fillStyle = 'rgba(12, 39, 72, 0.55)'
        ctx.arc(item.x, item.y, markerR + 1.15, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = active || hovered ? '#e6dcc8' : '#c4a35a'
        ctx.arc(item.x, item.y, markerR, 0, Math.PI * 2)
        ctx.fill()
      })

      const labeled = pins.filter((item) => (
        item.state.code === selectedRef.current || item.state.code === hoverCode
      ))
      labeled.forEach((item) => {
        const active = item.state.code === selectedRef.current
        ctx.font = `600 ${active ? 11 : 10}px "Source Sans 3", system-ui, sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(12, 39, 72, 0.85)'
        ctx.shadowBlur = 6
        ctx.fillStyle = '#f4f1ea'
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
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event) => {
      const next = localPoint(event)
      pointer = { x: next.x / width, y: next.y / height }
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

    Promise.all([
      loadImage('/images/earth-day.jpg'),
      fetch('/data/world.geojson').then((response) => response.json()),
    ]).then(([image, geojson]) => {
      if (cancelled) return
      landCanvas.width = image.width
      landCanvas.height = image.height
      const landCtx = landCanvas.getContext('2d', { willReadFrequently: true })
      landCtx.drawImage(image, 0, 0)
      const data = landCtx.getImageData(0, 0, image.width, image.height)
      landPixels = data.data
      landWidth = image.width
      landHeight = image.height
      rings = extractRings(geojson)
      lastPaintKey = ''
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
