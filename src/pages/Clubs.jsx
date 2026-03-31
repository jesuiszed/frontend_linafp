import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeams, getStandings } from '../services/api.js'

function ClubCard({ team, standing }) {
  const initial = (team.nom || '?')[0].toUpperCase()
  const pts = standing?.points ?? 0
  const pj  = standing?.played ?? 0
  const wins = standing?.won ?? 0
  const pos  = standing?._pos ?? '-'

  return (
    <Link to={`/clubs/${team.id}`} className="club-card" style={{ textDecoration: 'none' }}>
      <div className="club-card-header">
        {team.logo ? (
          <img className="club-logo" src={team.logo} alt={team.nom}
            onError={(e) => { e.target.style.display = 'none' }} />
        ) : (
          <div className="club-logo-placeholder">{initial}</div>
        )}
        <div className="club-name">{team.nom}</div>
        <div className="club-city">{team.ville || 'Gabon'}</div>
      </div>
      <div className="club-card-body">
        <div className="club-stat-row">
          <span className="club-stat-label">Stade</span>
          <span className="club-stat-value" style={{ fontSize: '0.75rem', textAlign: 'right', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.stade || '–'}
          </span>
        </div>
        <div className="club-stat-row">
          <span className="club-stat-label">Classement</span>
          <span className="club-stat-value" style={{ color: pos === 1 ? 'var(--f1-red)' : undefined }}>
            {pos !== '-' ? `${pos}e` : '–'}
          </span>
        </div>
        <div className="club-stat-row">
          <span className="club-stat-label">Matchs joués</span>
          <span className="club-stat-value">{pj}</span>
        </div>
        <div className="club-stat-row">
          <span className="club-stat-label">Victoires</span>
          <span className="club-stat-value">{wins}</span>
        </div>
        <div className="club-stat-row">
          <span className="club-stat-label">Points</span>
          <span className="club-stat-value" style={{ color: 'var(--f1-red)' }}>{pts}</span>
        </div>
      </div>
    </Link>
  )
}

export default function Clubs() {
  const [teams, setTeams]       = useState([])
  const [standings, setStandings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    Promise.all([getTeams(), getStandings().catch(() => ({ data: [] }))])
      .then(([tRes, sRes]) => {
        setTeams(tRes.data)
        setStandings(sRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const standingMap = standings.reduce((acc, s, i) => {
    acc[s.team_id] = { ...s, _pos: i + 1 }
    return acc
  }, {})

  const filtered = teams.filter((t) =>
    !search || t.nom.toLowerCase().includes(search.toLowerCase()) ||
    (t.ville || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div style={{ flex: 1, background: 'var(--off-white)' }}>
      {/* Page header */}
      <div style={{
        background: 'var(--f1-dark)', padding: '2.5rem 1.5rem 3rem',
        borderBottom: '3px solid var(--f1-red)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{
            color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: '0.5rem',
          }}>
            Clubs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Les équipes du Championnat National LINAFP · Saison 2025-2026
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Search */}
        <div style={{ marginBottom: '2rem', maxWidth: '360px' }}>
          <input
            type="search"
            placeholder="Rechercher un club…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Chargement des clubs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
            <p style={{ fontWeight: '700', marginTop: '1rem' }}>Aucun club trouvé.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}>
            {filtered.map((team) => (
              <ClubCard key={team.id} team={team} standing={standingMap[team.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
