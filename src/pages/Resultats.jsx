import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMatches, getTeams } from '../services/api.js'

function formatDate(iso) {
  if (!iso) return 'Date inconnue'
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function MatchCard({ match, teams }) {
  const home = match.home_team?.nom || teams.find((t) => t.id === match.home_team_id)?.nom || `Éq.${match.home_team_id}`
  const away = match.away_team?.nom || teams.find((t) => t.id === match.away_team_id)?.nom || `Éq.${match.away_team_id}`
  const played = match.home_score != null && match.away_score != null
  const homeWin = played && match.home_score > match.away_score
  const awayWin = played && match.away_score > match.home_score

  return (
    <Link to={`/resultats/${match.id}`} className="match-card" style={{ textDecoration: 'none' }}>
      <span className={`match-team${homeWin ? ' winner' : ''}`}>{home}</span>
      <div style={{ textAlign: 'center' }}>
        {played ? (
          <div className="match-score-box">
            {match.home_score} – {match.away_score}
          </div>
        ) : (
          <div className="match-score-box upcoming">
            À venir
          </div>
        )}
        <div className="match-meta">
          {formatDate(match.date)}
          {match.stade ? ` · ${match.stade}` : ''}
        </div>
      </div>
      <span className={`match-team away${awayWin ? ' winner' : ''}`}>{away}</span>
    </Link>
  )
}

export default function Resultats() {
  const [matches, setMatches] = useState([])
  const [teams, setTeams]     = useState([])
  const [tab, setTab]         = useState('results')
  const [filterTeam, setFilterTeam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMatches(), getTeams().catch(() => ({ data: [] }))])
      .then(([mRes, tRes]) => {
        setMatches(mRes.data)
        setTeams(tRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const played = matches
    .filter((m) => m.home_score != null && m.away_score != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const upcoming = matches
    .filter((m) => m.home_score == null || m.away_score == null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const visible = (tab === 'results' ? played : upcoming)
    .filter((m) =>
      !filterTeam ||
      m.home_team_id === Number(filterTeam) ||
      m.away_team_id === Number(filterTeam),
    )

  return (
    <div style={{ flex: 1, background: 'var(--off-white)' }}>
      {/* Header */}
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
            Matchs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Résultats et calendrier · Championnat National LINAFP 2025-2026
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Tabs */}
        <div className="tab-bar">
          <button className={`tab-btn${tab === 'results' ? ' active' : ''}`} onClick={() => setTab('results')}>
            Résultats ({played.length})
          </button>
          <button className={`tab-btn${tab === 'fixtures' ? ' active' : ''}`} onClick={() => setTab('fixtures')}>
            Calendrier ({upcoming.length})
          </button>
        </div>

        {/* Club filter */}
        {teams.length > 0 && (
          <div style={{ marginBottom: '1.5rem', maxWidth: '260px' }}>
            <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
              <option value="">Tous les clubs</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Chargement…</p></div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
            <p style={{ fontWeight: '700', marginTop: '1rem' }}>
              {tab === 'results' ? 'Aucun résultat disponible.' : 'Aucun match à venir.'}
            </p>
          </div>
        ) : (
          <div>
            {visible.map((m) => (
              <MatchCard key={m.id} match={m} teams={teams} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
