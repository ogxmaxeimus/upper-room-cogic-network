import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import NetworkGlobe from '../components/NetworkGlobe'
import MemberCard from '../components/MemberCard'
import './CitiesPage.css'

export default function CitiesPage() {
  const { getStateGroups } = useNetwork()
  const states = getStateGroups()
  const [params, setParams] = useSearchParams()

  const selectedCode = params.get('state')
  const selectedCity = params.get('city')

  const matchedState = useMemo(
    () => states.find((state) => state.code === selectedCode) || null,
    [states, selectedCode],
  )
  const selectedState = matchedState || states[0] || null

  const activeCity = selectedState?.cities.find((city) => city.slug === selectedCity)
    || selectedState?.cities[0]
    || null

  useEffect(() => {
    if (!selectedState) return
    const cityExists = selectedState.cities.some((city) => city.slug === selectedCity)
    if (matchedState && cityExists) return
    const next = new URLSearchParams()
    next.set('state', selectedState.code)
    if (selectedState.cities[0]) next.set('city', selectedState.cities[0].slug)
    setParams(next, { replace: true })
  }, [selectedState, matchedState, selectedCity, setParams])

  const selectState = (code) => {
    const state = states.find((item) => item.code === code)
    const next = new URLSearchParams()
    next.set('state', code)
    if (state?.cities[0]) next.set('city', state.cities[0].slug)
    setParams(next)
  }

  const selectCity = (slug) => {
    const next = new URLSearchParams(params)
    next.set('city', slug)
    setParams(next)
  }

  return (
    <div className="cities-page">
      <header className="cities-page__header">
        <p className="cities-page__eyebrow">States · Cities · Members</p>
        <h1>The Upper Room map</h1>
        <p>
          The globe points to each state where members serve. Select a state to see
          its cities, then the professionals in that area. Demo profiles fill extra
          cities and states so you can try the full flow.
        </p>
      </header>

      <div className="globe-explorer">
        <section className="globe-explorer__stage" aria-label="Member globe">
          <div className="globe-explorer__frame">
            <NetworkGlobe
              states={states}
              selectedCode={selectedState?.code}
              onSelect={selectState}
            />
            <p className="globe-explorer__hint">Drag to turn the globe. Click a state pin to open its cities.</p>
          </div>
        </section>

        <aside className="globe-explorer__panel">
          {states.length === 0 ? (
            <p className="globe-explorer__empty">
              Members appear here when they join with a city and state.
            </p>
          ) : (
            <>
              <div className="state-pills">
                {states.map((state) => (
                  <button
                    key={state.code}
                    type="button"
                    className={state.code === selectedState?.code ? 'state-pill is-active' : 'state-pill'}
                    onClick={() => selectState(state.code)}
                  >
                    {state.code}
                    <span>{state.count}</span>
                  </button>
                ))}
              </div>

              {selectedState && (
                <>
                  <div className="globe-explorer__state">
                    <h2>{selectedState.name}</h2>
                    <p>
                      {selectedState.count} member{selectedState.count !== 1 ? 's' : ''} across{' '}
                      {selectedState.cities.length}{' '}
                      {selectedState.cities.length === 1 ? 'city' : 'cities'}
                    </p>
                  </div>

                  <ul className="city-list">
                    {selectedState.cities.map((city) => (
                      <li key={city.slug}>
                        <button
                          type="button"
                          className={city.slug === activeCity?.slug ? 'city-list__btn is-active' : 'city-list__btn'}
                          onClick={() => selectCity(city.slug)}
                        >
                          <span className="city-list__name">{city.city}</span>
                          <span className="city-list__count">
                            {city.count} member{city.count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>

      {activeCity && (
        <section className="city-members">
          <div className="section__header section__header--row">
            <div>
              <h2>{activeCity.location}</h2>
              <p>
                {activeCity.count} network member{activeCity.count !== 1 ? 's' : ''} in this city
              </p>
            </div>
            <Link to={`/cities/${activeCity.slug}`} className="section__link">
              Open city page →
            </Link>
          </div>
          <div className="member-grid">
            {activeCity.members.map((member) => (
              <MemberCard key={member.id} member={member} vibe />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
