import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import {
  ArrowDown, ArrowDownRight, ArrowLeftRight, ArrowRight, Check, ChevronDown, Command,
  Compass, Heart, Menu, Orbit, Search, Sparkles, X,
} from 'lucide-react'
import { categories, discoveries, planets } from './data/planets'

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value)
const formatDistance = (km) => km >= 1_000_000_000
  ? `${(km / 1_000_000_000).toFixed(2)} billion km`
  : `${(km / 1_000_000).toFixed(1)} million km`
const planetById = (id) => planets.find((planet) => planet.id === id)

function PlanetOrb({ planet, className = '', size = 'medium', label = false }) {
  return (
    <span
      className={`planet-orb orb-${planet.id} orb-${size} ${className}`}
      style={{ '--planet-color': planet.color }}
      role="img"
      aria-label={`${planet.name} illustration`}
    >
      {label && <span className="orb-ring" aria-hidden="true" />}
    </span>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay, ease: [0.2, 0.75, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Overlay({ children, onClose, label, panelClass = '' }) {
  const closeRef = useRef(null)
  const closeHandler = useRef(onClose)
  closeHandler.current = onClose
  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeRef.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') closeHandler.current()
      if (event.key === 'Tab') {
        const dialog = event.currentTarget.querySelector('[role="dialog"]')
        const items = dialog?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    document.body.classList.add('overlay-open')
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.classList.remove('overlay-open')
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus()
    }
  }, [])

  return (
    <motion.div
      className="overlay-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`overlay-panel ${panelClass}`}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.22 }}
      >
        {children(closeRef)}
      </motion.section>
    </motion.div>
  )
}

function PlanetDetail({ planet, onClose, onFavorite, isFavorite }) {
  const facts = [
    ['Diameter', `${formatNumber(planet.diameterKm)} km`],
    ['Mean distance from Sun', formatDistance(planet.distanceFromSunKm)],
    ['Orbital period', `${planet.orbitalPeriodDays.toLocaleString('en-US')} Earth days`],
    ['Rotation period', planet.rotationPeriod],
    ['Gravity', planet.gravity],
    ['Temperature', planet.temperature],
  ]
  return (
    <Overlay onClose={onClose} label={`${planet.name} planet details`} panelClass="detail-panel">
      {(closeRef) => (
        <>
          <div className="detail-topline">
            <span className="eyebrow"><span className="status-dot" /> PLANETARY FIELD NOTES</span>
            <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close planet details"><X size={19} /></button>
          </div>
          <div className="detail-main">
            <div className="detail-visual">
              <span className="detail-orbit detail-orbit-one" />
              <span className="detail-orbit detail-orbit-two" />
              <PlanetOrb planet={planet} size="hero" label />
              <span className="detail-coordinate">SOLAR SYSTEM / {planet.order}</span>
            </div>
            <div className="detail-copy">
              <div className="eyebrow">{planet.category.toUpperCase()} · WORLD {planet.order}</div>
              <h2>{planet.name}<span className="period">.</span></h2>
              <p>{planet.description}</p>
              <div className="detail-highlight"><Sparkles size={16} /><span>{planet.fact}</span></div>
              <button className={`button ${isFavorite ? 'button-saved' : 'button-secondary'}`} onClick={() => onFavorite(planet.id)}>
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'Saved to your collection' : 'Save to favorites'}
              </button>
            </div>
          </div>
          <div className="detail-data">
            {facts.map(([label, value]) => <div className="detail-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            <div className="detail-stat"><span>Known moons</span><strong>{planet.moons}</strong></div>
          </div>
          <div className="detail-notes">
            <div><span className="eyebrow">ATMOSPHERE</span><p>{planet.atmosphere}</p></div>
            <div><span className="eyebrow">COMPOSITION</span><p>{planet.composition}</p></div>
          </div>
          <p className="data-note">Distances are mean values; temperature refers to the surface or atmosphere as labeled. Moon counts may change with new discoveries. Values are rounded for readability.</p>
        </>
      )}
    </Overlay>
  )
}

function App() {
  const [selectedId, setSelectedId] = useState('earth')
  const [detailId, setDetailId] = useState(null)
  const [filter, setFilter] = useState('All Worlds')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cosmos-favorites') || '[]')
      return Array.isArray(saved) ? saved.filter((id) => planets.some((planet) => planet.id === id)) : []
    } catch {
      return []
    }
  })
  const [compareA, setCompareA] = useState('earth')
  const [compareB, setCompareB] = useState('jupiter')
  const selectedPlanet = planetById(selectedId) || planets[2]
  const detailPlanet = detailId ? planetById(detailId) : null
  const searchInput = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, skipInitialAnimation: true })

  useEffect(() => {
    try { localStorage.setItem('cosmos-favorites', JSON.stringify(favorites)) } catch (error) {
      console.warn('COSMOS could not save favorites in this browser.', error)
    }
  }, [favorites])

  useEffect(() => {
    const sections = ['home', 'explore', 'planets', 'discover']
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.2, 0.5] })
    sections.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInput.current?.focus(), 60)
  }, [searchOpen])

  const toggleFavorite = (id) => setFavorites((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id])
  const filteredPlanets = useMemo(() => planets.filter((planet) =>
    (filter === 'All Worlds' || planet.category === filter)
    && (!query || `${planet.name} ${planet.category} ${planet.description}`.toLowerCase().includes(query.toLowerCase())),
  ), [filter, query])
  const searchResults = useMemo(() => {
    if (!query.trim()) return planets.slice(0, 4)
    return planets.filter((planet) => `${planet.name} ${planet.category} ${planet.description} ${planet.fact}`.toLowerCase().includes(query.toLowerCase()))
  }, [query])
  const favoritePlanets = favorites.map(planetById).filter(Boolean)

  const openDetail = (id) => {
    setDetailId(id)
    setSearchOpen(false)
    setFavoritesOpen(false)
  }
  const goTo = (id) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' })
  }

  return (
    <div className="site-shell">
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goTo('home') }} aria-label="COSMOS home">
          <span className="brand-mark"><Orbit size={21} strokeWidth={1.6} /></span>
          <span>COSMOS<span className="brand-period">.</span></span>
        </a>
        <nav className={`primary-nav ${mobileOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {[['home', 'Home'], ['explore', 'Explore'], ['planets', 'Planets'], ['discover', 'Discover']].map(([id, label]) => (
            <button key={id} className={activeSection === id ? 'nav-link active' : 'nav-link'} onClick={() => goTo(id)}>{label}</button>
          ))}
          <button className="mobile-search" onClick={() => { setSearchOpen(true); setMobileOpen(false) }}><Search size={16} /> Search the cosmos</button>
        </nav>
        <div className="header-actions">
          <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search the cosmos"><Search size={17} /><span>Search</span><kbd>⌘ K</kbd></button>
          <button className="favorite-trigger" onClick={() => setFavoritesOpen(true)} aria-label={`Open favorites, ${favorites.length} saved`}>
            <Heart size={17} /><span className="favorite-count">{favorites.length}</span>
          </button>
          <button className="menu-trigger icon-button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section section-wrap" id="home">
          <div className="hero-copy">
            <motion.div className="eyebrow hero-eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <span className="status-dot" /> A JOURNEY THROUGH SPACE
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              EXPLORE THE<br /><span>INFINITE.</span>
            </motion.h1>
            <motion.p className="hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              A little closer to the worlds beyond ours. Discover planets, distant wonders, and the stories written across the stars.
            </motion.p>
            <motion.div className="hero-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}>
              <button className="button button-primary" onClick={() => goTo('explore')}>Begin exploration <ArrowRight size={17} /></button>
              <button className="text-button" onClick={() => goTo('planets')}>Discover the planets <ArrowDownRight size={17} /></button>
            </motion.div>
            <motion.div className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              <span className="meta-icon"><Compass size={17} /></span><span>YOUR WINDOW TO THE<br /><strong>KNOWN UNIVERSE</strong></span>
              <span className="meta-divider" />
              <span className="meta-coordinate">SOL / 00° 00′ 00″</span>
            </motion.div>
          </div>
          <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.88, x: 16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.28, ease: [0.15, 0.7, 0.2, 1] }}>
            <div className="hero-starfield" />
            <div className="hero-halo" />
            <div className="hero-orbit hero-orbit-a" />
            <div className="hero-orbit hero-orbit-b" />
            <div className="hero-planet"><span className="hero-planet-shade" /></div>
            <div className="hero-moon" />
            <div className="planet-label"><span className="label-line" /><span>EARTH<br /><small>THE BLUE MARBLE</small></span></div>
            <div className="hero-coordinate">03 / 08<br /><span>LOCAL GROUP</span></div>
            <span className="hero-art-caption">A SMALL WORLD<br />IN A VAST UNIVERSE</span>
          </motion.div>
          <button className="scroll-cue" onClick={() => goTo('explore')} aria-label="Scroll to explore"><span>SCROLL TO EXPLORE</span><ArrowDown size={16} /></button>
          <div className="hero-index">01 <span>/</span> 04</div>
        </section>

        <section className="explorer-section section-wrap" id="explore">
          <Reveal className="section-heading-row">
            <div><div className="eyebrow section-eyebrow">01 — OUR NEIGHBORHOOD</div><h2>One star. <span>Eight worlds.</span></h2></div>
            <p className="section-intro">Start close to home. Choose a world and discover what makes it extraordinary.</p>
          </Reveal>
          <Reveal className="orbit-explorer" delay={0.12}>
            <div className="orbit-topline"><span><span className="live-dot" /> SOLAR SYSTEM EXPLORER</span><span>ILLUSTRATIVE · NOT TO SCALE</span></div>
            <div className="orbit-stage">
              <div className="orbit-rings" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="sun-core"><span>SOL</span></div>
              <div className="planet-track">
                {planets.map((planet) => (
                  <button key={planet.id} className={`orbit-planet ${selectedId === planet.id ? 'selected' : ''}`} onClick={() => setSelectedId(planet.id)} aria-pressed={selectedId === planet.id} aria-label={`Select ${planet.name}`}>
                    <PlanetOrb planet={planet} size="tiny" label />
                    <span className="orbit-label">{planet.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="explorer-foot">
              <div className="selected-world">
                <PlanetOrb planet={selectedPlanet} size="small" />
                <div><span className="eyebrow">NOW EXPLORING</span><h3>{selectedPlanet.name}</h3></div>
                <p>{selectedPlanet.description}</p>
              </div>
              <div className="explorer-quick-stat"><span>MEAN DISTANCE</span><strong>{formatDistance(selectedPlanet.distanceFromSunKm)}</strong></div>
              <button className="explorer-open" onClick={() => openDetail(selectedPlanet.id)}>Explore world <ArrowRight size={16} /></button>
            </div>
          </Reveal>
        </section>

        <section className="planets-section section-wrap" id="planets">
          <Reveal className="section-heading-row planets-heading">
            <div><div className="eyebrow section-eyebrow">02 — THE PLANET ARCHIVE</div><h2>Worlds of <span>wonder.</span></h2></div>
            <p className="section-intro">Eight planets, each with a story shaped by time, gravity, and starlight.</p>
          </Reveal>
          <Reveal className="planet-toolbar">
            <div className="filter-list" role="group" aria-label="Filter planets by type">
              {categories.map((category) => <button key={category} className={filter === category ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(category)} aria-pressed={filter === category}>{category}</button>)}
            </div>
            <label className="collection-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a world..." aria-label="Search planet collection" />{query && <button onClick={() => setQuery('')} aria-label="Clear planet search"><X size={14} /></button>}</label>
          </Reveal>
          <div className="planet-grid">
            {filteredPlanets.map((planet, index) => (
              <Reveal key={planet.id} className={`planet-card ${index === 0 ? 'planet-card-feature' : ''}`} delay={(index % 4) * 0.045}>
                <button className="card-open" onClick={() => openDetail(planet.id)} aria-label={`Explore ${planet.name}`}>
                  <span className="card-topline"><span>{planet.order} / SOL</span><span>{planet.category.toUpperCase()}</span></span>
                  <span className={`card-planet-scene scene-${planet.id}`}><span className="card-star" /><PlanetOrb planet={planet} size={index === 0 ? 'large' : 'medium'} label /></span>
                  <span className="card-copy"><span><strong>{planet.name}</strong><small>{planet.description}</small></span><span className="card-arrow"><ArrowUpRightIcon /></span></span>
                  <span className="card-data"><span><small>DIAMETER</small><strong>{formatNumber(planet.diameterKm)} <i>km</i></strong></span><span><small>ORBITAL PERIOD</small><strong>{planet.orbitalPeriodDays.toLocaleString('en-US')} <i>days</i></strong></span></span>
                </button>
                <button className={`card-favorite ${favorites.includes(planet.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(planet.id)} aria-label={favorites.includes(planet.id) ? `Remove ${planet.name} from favorites` : `Add ${planet.name} to favorites`} aria-pressed={favorites.includes(planet.id)}>
                  <Heart size={16} fill={favorites.includes(planet.id) ? 'currentColor' : 'none'} />
                </button>
              </Reveal>
            ))}
            {filteredPlanets.length === 0 && <div className="empty-collection"><Search size={23} /><strong>No worlds found</strong><span>Try another name or clear the search.</span><button className="text-button" onClick={() => { setQuery(''); setFilter('All Worlds') }}>Show all planets <ArrowRight size={15} /></button></div>}
          </div>
          <p className="moon-note">Moon counts can change as new discoveries are confirmed. Distances shown are mean distances from the Sun.</p>
        </section>

        <section className="comparison-section section-wrap" id="compare">
          <Reveal className="comparison-header">
            <div><div className="eyebrow section-eyebrow">03 — A DIFFERENT PERSPECTIVE</div><h2>Worlds, <span>side by side.</span></h2></div>
            <p>Choose two planets to see how their scale and journeys around the Sun compare.</p>
          </Reveal>
          <Reveal className="compare-panel">
            <div className="compare-selectors">
              <label><span>WORLD ONE</span><span className="select-wrap"><select value={compareA} onChange={(event) => setCompareA(event.target.value)} aria-label="Select first planet">{planets.map((planet) => <option key={planet.id} value={planet.id}>{planet.name}</option>)}</select><ChevronDown size={15} /></span></label>
              <span className="compare-symbol"><ArrowLeftRight size={19} /></span>
              <label><span>WORLD TWO</span><span className="select-wrap"><select value={compareB} onChange={(event) => setCompareB(event.target.value)} aria-label="Select second planet">{planets.map((planet) => <option key={planet.id} value={planet.id}>{planet.name}</option>)}</select><ChevronDown size={15} /></span></label>
            </div>
            <div className="compare-worlds">
              {[planetById(compareA), planetById(compareB)].map((planet) => <div className="compare-world" key={planet.id}><PlanetOrb planet={planet} size="compare" label /><div><span className="eyebrow">{planet.category.toUpperCase()}</span><h3>{planet.name}</h3><span>{planet.description}</span></div></div>)}
            </div>
            <div className="compare-metrics">
              <div className="metric-label">DIAMETER <small>relative scale</small></div>
              {[planetById(compareA), planetById(compareB)].map((planet) => <div className="metric-value" key={`diameter-${planet.id}`}><span>{formatNumber(planet.diameterKm)} km</span><div className="metric-bar"><i style={{ width: `${Math.max(4, planet.diameterKm / Math.max(planetById(compareA).diameterKm, planetById(compareB).diameterKm) * 100)}%`, background: planet.color }} /></div></div>)}
              <div className="metric-label">YEAR LENGTH <small>Earth days</small></div>
              {[planetById(compareA), planetById(compareB)].map((planet) => <div className="metric-value" key={`year-${planet.id}`}><span>{planet.orbitalPeriodDays.toLocaleString('en-US')} days</span><div className="metric-bar"><i style={{ width: `${Math.max(4, planet.orbitalPeriodDays / Math.max(planetById(compareA).orbitalPeriodDays, planetById(compareB).orbitalPeriodDays) * 100)}%`, background: planet.color }} /></div></div>)}
              <div className="metric-label">DISTANCE FROM SUN <small>mean distance</small></div>
              {[planetById(compareA), planetById(compareB)].map((planet) => <div className="metric-value" key={`distance-${planet.id}`}><span>{formatDistance(planet.distanceFromSunKm)}</span><div className="metric-bar"><i style={{ width: `${Math.max(4, planet.distanceFromSunKm / Math.max(planetById(compareA).distanceFromSunKm, planetById(compareB).distanceFromSunKm) * 100)}%`, background: planet.color }} /></div></div>)}
            </div>
            <p className="compare-caption">Bars are scaled within this comparison only. Diameters are mean planetary diameters; orbital periods are Earth days.</p>
          </Reveal>
        </section>

        <section className="discover-section section-wrap" id="discover">
          <Reveal className="section-heading-row discover-heading">
            <div><div className="eyebrow section-eyebrow">04 — FURTHER OUT</div><h2>Beyond our <span>solar system.</span></h2></div>
            <p className="section-intro">The cosmos is full of places and phenomena that stretch our imagination.</p>
          </Reveal>
          <div className="discovery-grid">
            {discoveries.map((item, index) => (
              <Reveal key={item.title} className={`discovery-card ${index === 0 ? 'discovery-feature' : ''}`} delay={index * 0.08}>
                <div className={`discovery-visual visual-${item.visual}`} aria-hidden="true">
                  {item.visual === 'pillars' && <><span className="nebula-cloud cloud-one" /><span className="nebula-cloud cloud-two" /><span className="pillar pillar-one" /><span className="pillar pillar-two" /><span className="pillar pillar-three" /></>}
                  {item.visual === 'galaxy' && <><span className="galaxy-core" /><span className="galaxy-arm arm-one" /><span className="galaxy-arm arm-two" /></>}
                  {item.visual === 'blackhole' && <><span className="blackhole-ring" /><span className="blackhole-core" /><span className="blackhole-flare" /></>}
                  <span className="visual-index">0{index + 1}</span>
                </div>
                <div className="discovery-copy"><span className="eyebrow">{item.kind}</span><h3>{item.title}</h3><p>{item.text}</p><span className="discovery-link">A GLIMPSE INTO THE UNKNOWN <ArrowRight size={14} /></span></div>
              </Reveal>
            ))}
          </div>
          <Reveal className="cosmic-note"><Sparkles size={17} /><span>There are more stars in the observable universe than grains of sand on all of Earth’s beaches.</span><span className="note-credit">A REMINDER OF OUR SCALE</span></Reveal>
        </section>
      </main>

      <footer className="site-footer section-wrap">
        <div className="footer-main">
          <div className="footer-brand"><a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goTo('home') }}><span className="brand-mark"><Orbit size={21} strokeWidth={1.6} /></span><span>COSMOS<span className="brand-period">.</span></span></a><p>The universe, within reach.</p></div>
          <div className="footer-links"><span className="eyebrow">CONTINUE EXPLORING</span><button onClick={() => goTo('explore')}>Solar system</button><button onClick={() => goTo('planets')}>Planet archive</button><button onClick={() => goTo('discover')}>Deep space</button></div>
          <div className="footer-links"><span className="eyebrow">YOUR UNIVERSE</span><button onClick={() => setFavoritesOpen(true)}>Saved worlds ({favorites.length})</button><button onClick={() => goTo('compare')}>Compare planets</button><button onClick={() => { setSearchOpen(true); setQuery('') }}>Search the cosmos</button></div>
          <div className="footer-coordinate"><span className="eyebrow">SOMEWHERE IN THE MILKY WAY</span><strong>13.6 BILLION YEARS<br />IN THE MAKING</strong><span>LOOK UP. STAY CURIOUS.</span></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} COSMOS EXPLORER</span><span>MADE FOR THE CURIOUS <Sparkles size={13} /></span><button onClick={() => goTo('home')}>BACK TO THE BEGINNING ↑</button></div>
      </footer>

      <AnimatePresence>
        {detailPlanet && <PlanetDetail planet={detailPlanet} onClose={() => setDetailId(null)} onFavorite={toggleFavorite} isFavorite={favorites.includes(detailPlanet.id)} />}
        {searchOpen && (
          <Overlay onClose={() => setSearchOpen(false)} label="Search planets and cosmic topics" panelClass="search-panel">
            {(closeRef) => (
              <>
                <div className="search-head"><span className="eyebrow">SEARCH THE UNIVERSE</span><button ref={closeRef} className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></div>
                <label className="search-field"><Search size={21} /><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A planet, a world, a wonder..." aria-label="Search planets and discoveries" /><kbd>ESC</kbd></label>
                <div className="search-results">
                  <span className="eyebrow">{query ? `${searchResults.length} WORLDS FOUND` : 'POPULAR DESTINATIONS'}</span>
                  {searchResults.map((planet) => <button className="search-result" key={planet.id} onClick={() => openDetail(planet.id)}><PlanetOrb planet={planet} size="small" /><span><strong>{planet.name}</strong><small>{planet.category} · {planet.description}</small></span><ArrowRight size={16} /></button>)}
                  {searchResults.length === 0 && <div className="search-empty"><span>No worlds found for “{query}”.</span><small>Try a planet name or category, such as “ice giant”.</small></div>}
                  <div className="search-hint"><Command size={13} /> Press <kbd>⌘ K</kbd> anytime to search</div>
                </div>
              </>
            )}
          </Overlay>
        )}
        {favoritesOpen && (
          <Overlay onClose={() => setFavoritesOpen(false)} label="Saved worlds" panelClass="favorites-panel">
            {(closeRef) => (
              <>
                <div className="favorites-header"><div><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>Saved worlds<span className="period">.</span></h2></div><button ref={closeRef} className="icon-button" onClick={() => setFavoritesOpen(false)} aria-label="Close favorites"><X size={18} /></button></div>
                {favoritePlanets.length ? <div className="favorite-list">{favoritePlanets.map((planet) => <div className="favorite-item" key={planet.id}><button className="favorite-world" onClick={() => openDetail(planet.id)}><PlanetOrb planet={planet} size="small" /><span><strong>{planet.name}</strong><small>{planet.category} · {formatDistance(planet.distanceFromSunKm)} from Sun</small></span><ArrowRight size={16} /></button><button className="remove-favorite" onClick={() => toggleFavorite(planet.id)} aria-label={`Remove ${planet.name} from favorites`}><X size={15} /></button></div>)}</div> : <div className="favorites-empty"><span className="empty-heart"><Heart size={23} /></span><strong>Your collection is waiting.</strong><p>Save a world that catches your eye and it will be here when you return.</p><button className="button button-primary" onClick={() => { setFavoritesOpen(false); goTo('planets') }}>Explore planets <ArrowRight size={16} /></button></div>}
                <div className="panel-footnote"><Check size={14} /> Your saved worlds stay on this device.</div>
              </>
            )}
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowRight size={18} />
}

export default App
