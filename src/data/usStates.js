export const US_STATES = {
  AL: { name: 'Alabama', lat: 32.81, lng: -86.79 },
  AK: { name: 'Alaska', lat: 64.20, lng: -153.37 },
  AZ: { name: 'Arizona', lat: 34.05, lng: -111.09 },
  AR: { name: 'Arkansas', lat: 34.97, lng: -92.37 },
  CA: { name: 'California', lat: 36.78, lng: -119.42 },
  CO: { name: 'Colorado', lat: 39.55, lng: -105.78 },
  CT: { name: 'Connecticut', lat: 41.60, lng: -72.76 },
  DE: { name: 'Delaware', lat: 38.91, lng: -75.53 },
  DC: { name: 'District of Columbia', lat: 38.91, lng: -77.04 },
  FL: { name: 'Florida', lat: 27.66, lng: -81.52 },
  GA: { name: 'Georgia', lat: 32.68, lng: -83.22 },
  HI: { name: 'Hawaii', lat: 20.80, lng: -156.33 },
  ID: { name: 'Idaho', lat: 44.07, lng: -114.74 },
  IL: { name: 'Illinois', lat: 40.63, lng: -89.40 },
  IN: { name: 'Indiana', lat: 39.85, lng: -86.26 },
  IA: { name: 'Iowa', lat: 41.88, lng: -93.10 },
  KS: { name: 'Kansas', lat: 38.53, lng: -98.32 },
  KY: { name: 'Kentucky', lat: 37.67, lng: -84.67 },
  LA: { name: 'Louisiana', lat: 31.17, lng: -91.87 },
  ME: { name: 'Maine', lat: 45.25, lng: -69.45 },
  MD: { name: 'Maryland', lat: 39.05, lng: -76.64 },
  MA: { name: 'Massachusetts', lat: 42.41, lng: -71.38 },
  MI: { name: 'Michigan', lat: 44.31, lng: -85.60 },
  MN: { name: 'Minnesota', lat: 46.73, lng: -94.69 },
  MS: { name: 'Mississippi', lat: 32.74, lng: -89.68 },
  MO: { name: 'Missouri', lat: 38.46, lng: -92.29 },
  MT: { name: 'Montana', lat: 46.88, lng: -110.36 },
  NE: { name: 'Nebraska', lat: 41.49, lng: -99.90 },
  NV: { name: 'Nevada', lat: 38.80, lng: -116.42 },
  NH: { name: 'New Hampshire', lat: 43.19, lng: -71.57 },
  NJ: { name: 'New Jersey', lat: 40.06, lng: -74.41 },
  NM: { name: 'New Mexico', lat: 34.52, lng: -105.87 },
  NY: { name: 'New York', lat: 43.00, lng: -75.00 },
  NC: { name: 'North Carolina', lat: 35.63, lng: -79.81 },
  ND: { name: 'North Dakota', lat: 47.55, lng: -101.00 },
  OH: { name: 'Ohio', lat: 40.42, lng: -82.91 },
  OK: { name: 'Oklahoma', lat: 35.57, lng: -96.93 },
  OR: { name: 'Oregon', lat: 43.80, lng: -120.55 },
  PA: { name: 'Pennsylvania', lat: 41.20, lng: -77.19 },
  RI: { name: 'Rhode Island', lat: 41.68, lng: -71.51 },
  SC: { name: 'South Carolina', lat: 33.86, lng: -80.95 },
  SD: { name: 'South Dakota', lat: 43.97, lng: -99.90 },
  TN: { name: 'Tennessee', lat: 35.75, lng: -86.69 },
  TX: { name: 'Texas', lat: 31.97, lng: -99.90 },
  UT: { name: 'Utah', lat: 39.32, lng: -111.09 },
  VT: { name: 'Vermont', lat: 44.56, lng: -72.58 },
  VA: { name: 'Virginia', lat: 37.43, lng: -78.66 },
  WA: { name: 'Washington', lat: 47.40, lng: -121.49 },
  WV: { name: 'West Virginia', lat: 38.60, lng: -80.45 },
  WI: { name: 'Wisconsin', lat: 43.78, lng: -88.79 },
  WY: { name: 'Wyoming', lat: 43.08, lng: -107.29 },
}

const NAME_TO_CODE = Object.fromEntries(
  Object.entries(US_STATES).flatMap(([code, state]) => [
    [state.name.toLowerCase(), code],
    [code.toLowerCase(), code],
  ]),
)

NAME_TO_CODE['n.c.'] = 'NC'
NAME_TO_CODE['n.c'] = 'NC'
NAME_TO_CODE['n carolina'] = 'NC'
NAME_TO_CODE['north carolina'] = 'NC'
NAME_TO_CODE['washington dc'] = 'DC'
NAME_TO_CODE['washington d.c.'] = 'DC'
NAME_TO_CODE['d.c.'] = 'DC'
NAME_TO_CODE['d.c'] = 'DC'

export function getStateMeta(code) {
  return US_STATES[code] || null
}

export function resolveStateCode(value) {
  if (!value) return null
  const cleaned = value.trim().replace(/\./g, '').toLowerCase()
  if (cleaned.length === 2) {
    const code = cleaned.toUpperCase()
    return US_STATES[code] ? code : null
  }
  return NAME_TO_CODE[value.trim().toLowerCase()]
    || NAME_TO_CODE[cleaned]
    || null
}

export function parseLocation(location) {
  if (!location || typeof location !== 'string') return null
  const trimmed = location.trim()
  if (!trimmed || trimmed === 'Location TBD') return null

  const comma = trimmed.match(/^(.*?),\s*([^,]+)$/)
  if (comma) {
    const city = comma[1].trim()
    const stateCode = resolveStateCode(comma[2])
    if (city && stateCode) {
      const meta = getStateMeta(stateCode)
      return { city, stateCode, stateName: meta.name, lat: meta.lat, lng: meta.lng }
    }
  }

  const spaced = trimmed.match(/^(.*)\s+([A-Za-z]{2})$/)
  if (spaced) {
    const city = spaced[1].replace(/,$/, '').trim()
    const stateCode = resolveStateCode(spaced[2])
    if (city && stateCode) {
      const meta = getStateMeta(stateCode)
      return { city, stateCode, stateName: meta.name, lat: meta.lat, lng: meta.lng }
    }
  }

  return null
}
