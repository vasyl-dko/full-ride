import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import universities from './data/universities.json'

// ─── Config ────────────────────────────────────────────────────────
// Update this once you've pushed to GitHub:
const GITHUB_URL = 'https://github.com/vasyl-dko/full-ride'

// ─── Utilities ────────────────────────────────────────────────────

const FLAG_MAP = {
  'USA': '🇺🇸',
  'UK': '🇬🇧',
  'UAE': '🇦🇪',
  'Switzerland': '🇨🇭',
  'Germany': '🇩🇪',
  'Singapore': '🇸🇬',
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
}

function getFlag(country) {
  return FLAG_MAP[country] || '🌐'
}

function parseSatRange(str) {
  if (!str || str === 'N/A') return null
  const m = str.match(/(\d{3,4})[–\-](\d{3,4})/)
  if (!m) return null
  return { low: parseInt(m[1]), high: parseInt(m[2]) }
}

function probColor(label) {
  if (label === 'Likely') return 'var(--green)'
  if (label === 'Possible') return 'var(--amber)'
  if (label === 'Reach') return 'var(--red)'
  return 'var(--text-muted)'
}

function calcProbability(uni, userGpa, userSat) {
  const sat = parseSatRange(uni.sat_range)

  // Admission score 0–4
  let score = 0
  const gpaGap = userGpa - uni.min_gpa
  if (gpaGap >= 0.1) score += 2
  else if (gpaGap >= -0.05) score += 1

  if (sat) {
    if (userSat >= sat.high) score += 2
    else if (userSat >= sat.low) score += 1
  } else {
    score += 1 // neutral when SAT not applicable
  }

  let admission
  if (score >= 4) admission = 'Likely'
  else if (score >= 2) admission = 'Possible'
  else admission = 'Reach'

  // Scholarship odds
  let scholarship
  const frRate = uni.full_ride_rate_of_admitted

  if (frRate === null) {
    scholarship = 'Need-Based'
  } else if (frRate === 100) {
    scholarship = admission
  } else if (frRate >= 50) {
    if (score >= 4) scholarship = 'Likely'
    else if (score >= 2) scholarship = 'Possible'
    else scholarship = 'Reach'
  } else if (frRate >= 5) {
    if (score >= 4) scholarship = 'Possible'
    else scholarship = 'Reach'
  } else {
    scholarship = 'Reach'
  }

  return { admission, scholarship }
}

function formatNum(n) {
  if (n === null || n === undefined) return 'N/A'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

// Derives scholarship classification from existing data fields.
// JSON entries can override with an explicit `scholarship_type` field.
function getScholarshipType(uni) {
  if (uni.scholarship_type) return uni.scholarship_type   // explicit override in JSON
  if (uni.merit_only) return 'merit'
  if (['Switzerland', 'Germany'].includes(uni.country)) return 'low_tuition'
  if (uni.admitted_full_ride !== null && uni.admitted_full_ride > 0) return 'merit_need'
  return 'need'
}

// Aid-type glossary definitions shown in tooltips
const TYPE_GLOSSARY = {
  merit:       'Awarded purely on academic/extracurricular achievement. No income information required.',
  need:        'Awarded based on demonstrated financial need. Amount varies by family income.',
  merit_need:  'University offers both merit-based scholarships and need-based grants. You may qualify for one or both.',
  low_tuition: 'Tuition fees are minimal or near-zero for all students regardless of nationality. Additional living-cost support may be available.',
}

const TYPE_META = {
  merit:       { label: 'Merit',        color: '#C9A84C' },
  need:        { label: 'Need-Based',   color: '#58A6FF' },
  merit_need:  { label: 'Merit + Need', color: '#BC8CFF' },
  low_tuition: { label: 'Low Tuition',  color: '#3FB950' },
}

// ─── Hero ──────────────────────────────────────────────────────────

function Hero({ theme, onToggleTheme }) {
  return (
    <section className="hero" aria-label="Full Ride — Scholarship Intelligence">
      <div className="hero-content">
        <div className="hero-top-row">
          <div className="hero-badge" aria-label="Sample project">Scholarship Intelligence · Sample Project</div>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <h1 className="hero-title">Full Ride</h1>
        <p className="hero-subtitle">
          The definitive guide to merit scholarships, full-ride programs, and need-based aid
          at the world's most selective universities. Filter by region, classification, and
          olympiad recognition.
        </p>
        <div className="hero-stats" role="list" aria-label="Site statistics">
          <div className="hero-stat" role="listitem">
            <span className="hero-stat-num" aria-label="30 plus universities">30+</span>
            <span className="hero-stat-label">Universities</span>
          </div>
          <div className="hero-stat" role="listitem">
            <span className="hero-stat-num">10</span>
            <span className="hero-stat-label">Countries</span>
          </div>
          <div className="hero-stat" role="listitem">
            <span className="hero-stat-num">8</span>
            <span className="hero-stat-label">Full-Ride Programs</span>
          </div>
          <div className="hero-stat" role="listitem">
            <span className="hero-stat-num">Free</span>
            <span className="hero-stat-label">Always</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Disclaimer ────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="disclaimer">
      <span className="disclaimer-icon">⚠️</span>
      <div className="disclaimer-text">
        <strong>Sample Project — Approximate Data.</strong>{' '}
        All figures are publicly sourced estimates from official university websites, QS/THE rankings,
        and published financial aid reports. Numbers may be outdated or incomplete.
        Always verify with the official university or scholarship programme before applying.
      </div>
    </div>
  )
}

// ─── Footer ────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-heart">
          <span className="footer-heart-icon">💛</span>
          <p>Built with love by a son of a single mom who studied on a full ride.</p>
        </div>

        <div className="footer-divider" />

        <div className="footer-about">
          <h4 className="footer-heading">About This Project</h4>
          <p>
            This is a <strong>prototype</strong> built to explore the idea of a centralised,
            searchable intelligence tool for merit and full-ride scholarships at the world's
            most selective universities. All data is hand-curated from public sources and is
            approximate — the real version would need live API integrations, automated data
            pipelines, and regular audits.
          </p>
          <p style={{ marginTop: 10 }}>
            If you are a current undergraduate, a prospective student, or a developer who has
            felt this problem firsthand and wants to build this properly — I would love to hear
            from you. I am <strong>happy to transfer this project for free</strong> to whoever
            is willing to take it seriously. Making full-ride scholarship information genuinely
            accessible could change trajectories for a lot of people.
          </p>
        </div>

        <div className="footer-links">
          <a className="footer-link footer-link-email" href="mailto:vdavydko@gmail.com">
            ✉️ vdavydko@gmail.com
          </a>
          {GITHUB_URL && (
            <a
              className="footer-link footer-link-github"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </a>
          )}
        </div>

        <div className="footer-copy">
          <p>
            This project is open-source and free to use, fork, and build upon.
            If you take it further, a mention would be lovely — but is not required.
          </p>
        </div>

      </div>
    </footer>
  )
}

// ─── Filter Bar ────────────────────────────────────────────────────

function FilterBar({ filters, onChange, sortBy, onSortChange }) {
  return (
    <div className="filter-bar" role="search" aria-label="Filter and search universities">
      <div className="filter-bar-inner">

        {/* Search */}
        <div className="filter-group filter-group-search">
          <label className="filter-label" htmlFor="uni-search">Search</label>
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              id="uni-search"
              type="search"
              className="search-input"
              placeholder="University name…"
              value={filters.search}
              onChange={e => onChange('search', e.target.value)}
              aria-label="Search universities by name"
            />
            {filters.search && (
              <button
                className="search-clear"
                onClick={() => onChange('search', '')}
                aria-label="Clear search"
              >✕</button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="sort-select">Sort by</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={e => onSortChange(e.target.value)}
            aria-label="Sort universities"
          >
            <option value="default">Default</option>
            <option value="acceptance_asc">Acceptance Rate ↑</option>
            <option value="acceptance_desc">Acceptance Rate ↓</option>
            <option value="name_asc">Name A → Z</option>
            <option value="name_desc">Name Z → A</option>
          </select>
        </div>

        {/* Region */}
        <div className="filter-group">
          <label className="filter-label">Region</label>
          <div className="filter-pills" role="group" aria-label="Filter by region">
            {['All', 'North America', 'Europe', 'Asia & Pacific', 'Middle East'].map(r => (
              <button
                key={r}
                className={'pill' + (filters.region === r ? ' pill-active' : '')}
                onClick={() => onChange('region', r)}
                aria-pressed={filters.region === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Classification */}
        <div className="filter-group">
          <label className="filter-label">Classification</label>
          <div className="filter-pills" role="group" aria-label="Filter by aid classification">
            {['All', 'Merit', 'Need-Based', 'Merit + Need', 'Low Tuition'].map(t => (
              <button
                key={t}
                className={'pill' + (filters.type === t ? ' pill-active' : '')}
                onClick={() => onChange('type', t)}
                aria-pressed={filters.type === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Focus + GPA row */}
        <div className="filter-group">
          <label className="filter-label">Focus</label>
          <div className="filter-pills">
            <button
              className={'pill' + (filters.olympiadOnly ? ' pill-active' : '')}
              onClick={() => onChange('olympiadOnly', !filters.olympiadOnly)}
              aria-pressed={filters.olympiadOnly}
            >
              🏆 Olympiad Programs
            </button>
          </div>
        </div>

        {/* GPA Slider */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="gpa-slider">
            My GPA:{' '}
            <strong>{filters.minGpa.toFixed(2)}</strong>
            <span className="filter-label-hint"> (4.0 scale)</span>
          </label>
          <input
            id="gpa-slider"
            type="range"
            min="3.0"
            max="4.0"
            step="0.05"
            value={filters.minGpa}
            onChange={e => onChange('minGpa', parseFloat(e.target.value))}
            className="gpa-slider"
            aria-label={`My GPA: ${filters.minGpa.toFixed(2)} out of 4.0`}
          />
          <div className="slider-labels">
            <span>3.0</span>
            <span>4.0</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Stats Bar ─────────────────────────────────────────────────────

function StatsBar({ universities: unis }) {
  const confirmed = unis.filter(u => u.full_ride_rate_of_admitted !== null).length
  const avgRate = unis.length > 0
    ? (unis.reduce((s, u) => s + u.acceptance_rate, 0) / unis.length).toFixed(1)
    : '0.0'

  return (
    <div className="stats-bar">
      <span>
        Showing <strong>{unis.length}</strong> universities
        {' · '}Full rides confirmed at <strong>{confirmed}</strong>
        {' · '}Avg acceptance rate <strong>{avgRate}%</strong>
      </span>
    </div>
  )
}

// ─── Funnel ────────────────────────────────────────────────────────

function Funnel({ uni }) {
  const admitPct = uni.acceptance_rate
  const fullRidePct = uni.full_ride_rate_of_admitted !== null
    ? (admitPct * uni.full_ride_rate_of_admitted) / 100
    : null

  // Use sqrt scale so thin bars are visible while still proportional
  const scale = pct => Math.max(Math.sqrt(Math.min(pct, 100) / 100) * 100, 2)

  const admitW = scale(admitPct)
  const fullRideW = fullRidePct !== null ? scale(fullRidePct) : null

  return (
    <div className="funnel">
      <div className="funnel-row">
        <span className="funnel-label">Applied</span>
        <div className="funnel-bar-track">
          <div className="funnel-bar funnel-bar-1" style={{ width: '100%' }}>
            <span className="funnel-count">{formatNum(uni.total_applicants)}</span>
          </div>
        </div>
      </div>
      <div className="funnel-row">
        <span className="funnel-label">Admitted</span>
        <div className="funnel-bar-track">
          <div
            className="funnel-bar funnel-bar-2"
            style={{ width: admitW + '%' }}
          >
            <span className="funnel-count">{formatNum(uni.total_admitted)}</span>
          </div>
        </div>
      </div>
      <div className="funnel-row">
        <span className="funnel-label">Full Ride</span>
        <div className="funnel-bar-track">
          {fullRideW !== null ? (
            <div
              className="funnel-bar funnel-bar-3"
              style={{ width: Math.max(fullRideW, 2) + '%' }}
            >
              <span className="funnel-count">
                {uni.admitted_full_ride !== null ? formatNum(uni.admitted_full_ride) : '?'}
              </span>
            </div>
          ) : (
            <div className="funnel-bar funnel-bar-unknown" style={{ width: '55%' }}>
              <span className="funnel-count">Need-based</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Classification Badge ──────────────────────────────────────────

function ClassificationBadge({ type, large }) {
  const meta = TYPE_META[type] || TYPE_META.need
  const glossary = TYPE_GLOSSARY[type] || ''
  return (
    <span
      className={'type-badge' + (large ? ' type-badge-lg' : '')}
      style={{ '--badge-color': meta.color }}
      title={glossary}
      aria-label={`Aid type: ${meta.label}. ${glossary}`}
      role="img"
    >
      {meta.label}
    </span>
  )
}

// ─── University Card ───────────────────────────────────────────────

function UniversityCard({ uni, index, onSelect }) {
  return (
    <div
      className="uni-card"
      style={{ animationDelay: Math.min(index * 0.045, 0.55) + 's' }}
      onClick={() => onSelect(uni)}
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-flag">{getFlag(uni.country)}</span>
          <div style={{ minWidth: 0 }}>
            <h3 className="card-name">{uni.name}</h3>
            <span className="card-country">{uni.country}</span>
          </div>
        </div>
        <ClassificationBadge type={getScholarshipType(uni)} />
      </div>

      {/* Rates */}
      <div className="card-rates">
        <div className="rate-block">
          <span className="rate-value">{uni.acceptance_rate.toFixed(1)}%</span>
          <span className="rate-label">Acceptance</span>
        </div>
        <div className="rate-divider" />
        <div className="rate-block">
          {uni.full_ride_rate_of_admitted !== null ? (
            <>
              <span className="rate-value rate-gold">
                {uni.full_ride_rate_of_admitted === 100
                  ? '100%'
                  : uni.full_ride_rate_of_admitted < 1
                    ? '<1%'
                    : uni.full_ride_rate_of_admitted + '%'}
              </span>
              <span className="rate-label">Full Ride Rate</span>
            </>
          ) : (
            <>
              <span className="rate-value rate-muted">Need-based</span>
              <span className="rate-label">Aid Type</span>
            </>
          )}
        </div>
      </div>

      {/* Funnel */}
      <Funnel uni={uni} />

      {/* Olympiad badges */}
      {uni.olympiad_bonus && uni.olympiad_bonus.length > 0 && (
        <div className="card-badges">
          {uni.olympiad_bonus.map(o => (
            <span key={o} className="olympiad-badge">{o}</span>
          ))}
        </div>
      )}

      <button
        className="card-btn"
        onClick={e => { e.stopPropagation(); onSelect(uni) }}
      >
        Details →
      </button>
    </div>
  )
}

// ─── University Grid ───────────────────────────────────────────────

function UniversityGrid({ universities: unis, onSelect, filterKey }) {
  if (unis.length === 0) {
    return (
      <div className="uni-grid">
        <div className="empty-state">
          <p>No universities match these filters.</p>
          <p className="text-muted">Try adjusting the GPA threshold or region filter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="uni-grid" key={filterKey}>
      {unis.map((uni, i) => (
        <UniversityCard
          key={uni.id}
          uni={uni}
          index={i}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ─── Probability Estimator ─────────────────────────────────────────

function ProbabilityEstimator({ uni }) {
  const [userGpa, setUserGpa] = useState(3.7)
  const [userSat, setUserSat] = useState(1400)

  const { admission, scholarship } = calcProbability(uni, userGpa, userSat)

  return (
    <div className="prob-estimator">
      <h4 className="prob-title">Probability Estimator</h4>

      <div className="prob-controls">
        <div className="prob-control">
          <label>Your GPA: <strong>{userGpa.toFixed(2)}</strong></label>
          <input
            type="range"
            min="3.0"
            max="4.0"
            step="0.01"
            value={userGpa}
            onChange={e => setUserGpa(parseFloat(e.target.value))}
            className="gpa-slider"
          />
        </div>
        <div className="prob-control">
          <label>Your SAT: <strong>{userSat}</strong></label>
          <input
            type="range"
            min="1000"
            max="1600"
            step="10"
            value={userSat}
            onChange={e => setUserSat(parseInt(e.target.value))}
            className="gpa-slider"
          />
        </div>
      </div>

      <div className="prob-results">
        <div className="prob-result">
          <span className="prob-result-label">Admission</span>
          <span
            className="prob-result-value"
            style={{ color: probColor(admission) }}
          >
            {admission}
          </span>
        </div>
        <div className="prob-result">
          <span className="prob-result-label">Full Scholarship</span>
          <span
            className="prob-result-value"
            style={{ color: probColor(scholarship) }}
          >
            {scholarship}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────

function Modal({ uni, onClose }) {
  const backdropRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Inject per-university JSON-LD structured data for SEO
  useEffect(() => {
    const id = 'uni-jsonld'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': uni.name,
      'url': uni.admissions_url || undefined,
      'email': uni.admissions_email || undefined,
      'description': uni.notes,
      'address': { '@type': 'PostalAddress', 'addressCountry': uni.country },
    })
    return () => { el && el.remove() }
  }, [uni])

  const handleBackdrop = e => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleCopyLink = useCallback(() => {
    const url = window.location.origin + window.location.pathname + '#' + uni.id
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [uni.id])

  const dataRows = [
    ['Country', uni.country],
    ['Region', uni.region],
    ['Ranking', uni.ranking_note],
    ['Total Applicants', formatNum(uni.total_applicants)],
    ['Total Admitted', formatNum(uni.total_admitted)],
    ['Acceptance Rate', uni.acceptance_rate.toFixed(1) + '%'],
    [
      'Full Ride Recipients',
      uni.admitted_full_ride !== null ? formatNum(uni.admitted_full_ride) : 'Not tracked'
    ],
    [
      'Full Ride Rate (Admitted)',
      uni.full_ride_rate_of_admitted !== null
        ? uni.full_ride_rate_of_admitted + '%'
        : 'Need-based'
    ],
    [
      'Partial Scholarships',
      uni.admitted_partial_scholarship > 0
        ? formatNum(uni.admitted_partial_scholarship)
        : 'None tracked'
    ],
    ['Minimum GPA', uni.min_gpa.toFixed(1)],
    ['SAT Range', uni.sat_range || 'N/A'],
    ['Merit Only', uni.merit_only ? 'Yes' : 'No'],
    ['Need-Blind', uni.need_blind ? 'Yes' : 'No'],
    ['Citizenship', uni.citizenship_restrictions],
    ['Scholarship Deadline', uni.scholarship_deadline],
    ['Renewal Condition', uni.renewal_condition],
  ]

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={handleBackdrop}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={uni.name}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-flag">{getFlag(uni.country)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="modal-title">{uni.name}</h2>
            <span className="modal-subtitle">
              {uni.country} · {uni.region}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="modal-copy-link"
              onClick={handleCopyLink}
              aria-label="Copy shareable link"
              title="Copy shareable link"
            >
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            <ClassificationBadge type={getScholarshipType(uni)} large />
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Notes */}
          <div className="modal-notes">
            <p>{uni.notes}</p>
          </div>

          {/* Admissions contact */}
          {(uni.admissions_url || uni.admissions_email) && (
            <div className="modal-admissions">
              <h3 className="modal-admissions-title">Apply &amp; Contact</h3>
              <div className="modal-admissions-links">
                {uni.admissions_url && (
                  <a
                    className="modal-admissions-link modal-admissions-link-primary"
                    href={uni.admissions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${uni.name} admissions website (opens in new tab)`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Admissions Website
                  </a>
                )}
                {uni.admissions_email && (
                  <a
                    className="modal-admissions-link modal-admissions-link-email"
                    href={`mailto:${uni.admissions_email}`}
                    aria-label={`Email ${uni.name} admissions at ${uni.admissions_email}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {uni.admissions_email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Last verified */}
          {uni.last_verified && (
            <p className="modal-verified">
              <span aria-hidden="true">🗓</span>{' '}
              Data last verified: <strong>{uni.last_verified}</strong>. Always confirm with official sources.
            </p>
          )}

          {/* Olympiad */}
          {uni.olympiad_bonus && uni.olympiad_bonus.length > 0 && (
            <div className="modal-section">
              <h4>Olympiad Recognition</h4>
              <div className="modal-badges">
                {uni.olympiad_bonus.map(o => (
                  <span key={o} className="olympiad-badge olympiad-badge-lg">{o}</span>
                ))}
              </div>
            </div>
          )}

          {/* Data grid */}
          <div className="modal-data-grid">
            {dataRows.map(([label, value]) => (
              <div key={label} className="data-row">
                <span className="data-label">{label}</span>
                <span className="data-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Probability estimator */}
          <ProbabilityEstimator uni={uni} />
        </div>
      </div>
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────

const TYPE_FILTER_MAP = {
  'Merit':       'merit',
  'Need-Based':  'need',
  'Merit + Need':'merit_need',
  'Low Tuition': 'low_tuition',
}

function sortUniversities(list, sortBy) {
  if (sortBy === 'default') return list
  const sorted = [...list]
  if (sortBy === 'acceptance_asc') sorted.sort((a, b) => a.acceptance_rate - b.acceptance_rate)
  if (sortBy === 'acceptance_desc') sorted.sort((a, b) => b.acceptance_rate - a.acceptance_rate)
  if (sortBy === 'name_asc') sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy === 'name_desc') sorted.sort((a, b) => b.name.localeCompare(a.name))
  return sorted
}

// ─── Hash routing helpers ──────────────────────────────────────────

function getHashId() {
  return window.location.hash.replace(/^#/, '').trim() || null
}

function findUniById(id) {
  return universities.find(u => u.id === id) || null
}

export default function App() {
  // Theme — persisted to localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('fr-theme') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('fr-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  const [filters, setFilters] = useState({
    region: 'All',
    type: 'All',
    olympiadOnly: false,
    minGpa: 4.0,
    search: '',
  })
  const [sortBy, setSortBy] = useState('default')

  // Initialise from URL hash so direct links like /#mit open the modal immediately
  const [selectedUni, setSelectedUni] = useState(() => findUniById(getHashId()))
  const [filterKey, setFilterKey] = useState(0)

  // Keep URL hash in sync with open modal
  useEffect(() => {
    if (selectedUni) {
      window.history.replaceState(null, '', '#' + selectedUni.id)
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [selectedUni])

  // Handle browser back/forward navigation (popstate)
  useEffect(() => {
    const onPop = () => {
      const uni = findUniById(getHashId())
      setSelectedUni(uni)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const filtered = useMemo(() => {
    const base = universities.filter(u => {
      if (filters.search && !u.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.region !== 'All' && u.region !== filters.region) return false
      if (filters.type !== 'All' && getScholarshipType(u) !== TYPE_FILTER_MAP[filters.type]) return false
      if (filters.olympiadOnly && (!u.olympiad_bonus || u.olympiad_bonus.length === 0)) return false
      if (u.min_gpa > filters.minGpa) return false
      return true
    })
    return sortUniversities(base, sortBy)
  }, [filters, sortBy])

  useEffect(() => { setFilterKey(k => k + 1) }, [filters, sortBy])

  const onChange = useCallback((key, value) => setFilters(prev => ({ ...prev, [key]: value })), [])

  // Push a history entry when opening a card so back-button closes the modal
  const handleSelect = useCallback(uni => {
    window.history.pushState(null, '', '#' + uni.id)
    setSelectedUni(uni)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedUni(null)
  }, [])

  return (
    <div className="app">
      <Hero theme={theme} onToggleTheme={toggleTheme} />
      <Disclaimer />
      <div className="sticky-bar">
        <FilterBar filters={filters} onChange={onChange} sortBy={sortBy} onSortChange={setSortBy} />
        <StatsBar universities={filtered} />
      </div>
      <main className="main" id="main-content">
        <h2 className="sr-only">University Scholarship Directory</h2>
        <UniversityGrid
          universities={filtered}
          onSelect={handleSelect}
          filterKey={filterKey}
        />
      </main>
      <Footer />
      {selectedUni && (
        <Modal uni={selectedUni} onClose={handleClose} />
      )}
    </div>
  )
}
