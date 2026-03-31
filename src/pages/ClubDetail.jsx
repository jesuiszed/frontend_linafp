import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMatches, getStandings, getTeam } from '../services/api.js'

function formatDate(iso) {
  if (!iso) return 'Date inconnue'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ClubDetail() {
  const { id } = useParams()
  const [club, setClub] = useState(null)
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getTeam(id),
      getMatches().catch(() => ({ data: [] })),
      getStandings().catch(() => ({ data: [] })),
    ])
      .then(([clubRes, matchRes, standingRes]) => {
        setClub(clubRes.data)
        setMatches(matchRes.data)
        setStandings(standingRes.data)
      })
      .catch(() => setError('Club introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  const clubId = Number(id)

  const standing = useMemo(() => {
    const idx = standings.findIndex((s) => s.team_id === clubId)
    if (idx < 0) return null
    return { ...standings[idx], position: idx + 1 }
  }, [clubId, standings])

  const recentMatches = useMemo(() => {
    return matches
      .filter((m) => m.home_team_id === clubId || m.away_team_id === clubId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
  }, [clubId, matches])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Chargement du club...</p></div>
  if (error || !club) return <div className="page-container"><div className="error-box">{error || 'Club introuvable.'}</div></div>

  return (
    <div className="page-container">
      <Link to="/clubs" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>← Retour aux clubs</Link>

      <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {club.logo ? (
            <img src={club.logo} alt={club.nom} style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '10px', background: '#fff' }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '10px', background: 'var(--f1-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              {(club.nom || '?')[0]}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0 }}>{club.nom}</h1>
            <p style={{ color: 'var(--gray-500)', margin: '0.2rem 0 0' }}>{club.ville || 'Gabon'}{club.stade ? ` · ${club.stade}` : ''}</p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
          <div><strong>Classement</strong><div>{standing ? `${standing.position}e` : '-'}</div></div>
          <div><strong>Points</strong><div>{standing?.points ?? 0}</div></div>
          <div><strong>Matchs joues</strong><div>{standing?.played ?? 0}</div></div>
          <div><strong>Victoires</strong><div>{standing?.won ?? standing?.wins ?? 0}</div></div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '14px', padding: '1.2rem 1.5rem', border: '1px solid var(--gray-200)' }}>
        <h3 style={{ marginTop: 0 }}>Derniers matchs</h3>
        {recentMatches.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>Aucun match disponible.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentMatches.map((m) => (
              <Link key={m.id} to={`/resultats/${m.id}`} style={{ textDecoration: 'none', color: 'inherit', background: 'var(--gray-100)', borderRadius: '8px', padding: '0.65rem 0.75rem' }}>
                <strong>{m.home_team_id === clubId ? 'Domicile' : 'Exterieur'}</strong>
                <span style={{ marginLeft: '0.65rem' }}>
                  {m.home_score != null && m.away_score != null ? `${m.home_score} - ${m.away_score}` : 'A venir'}
                </span>
                <span style={{ marginLeft: '0.65rem', color: 'var(--gray-500)' }}>{formatDate(m.date)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
