import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMatch, getTeams } from '../services/api.js'

function formatDateTime(iso) {
  if (!iso) return 'Date inconnue'
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MatchDetail() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getMatch(id),
      getTeams().catch(() => ({ data: [] })),
    ])
      .then(([mRes, tRes]) => {
        setMatch(mRes.data)
        setTeams(tRes.data)
      })
      .catch(() => setError('Match introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  const teamName = (teamId) => teams.find((t) => t.id === teamId)?.nom || `Equipe ${teamId}`

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Chargement du match...</p></div>
  if (error || !match) return <div className="page-container"><div className="error-box">{error || 'Match introuvable.'}</div></div>

  const played = match.home_score != null && match.away_score != null

  return (
    <div className="page-container">
      <Link to="/resultats" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>← Retour aux resultats</Link>

      <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Journee {match.matchday || '-'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ textAlign: 'right', margin: 0 }}>{teamName(match.home_team_id)}</h2>
          <div style={{ background: 'var(--f1-dark)', color: '#fff', borderRadius: '10px', padding: '0.5rem 1rem', fontWeight: 900, fontSize: '1.1rem' }}>
            {played ? `${match.home_score} - ${match.away_score}` : 'A venir'}
          </div>
          <h2 style={{ margin: 0 }}>{teamName(match.away_team_id)}</h2>
        </div>

        <div style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>
          {formatDateTime(match.date)}{match.stade ? ` · ${match.stade}` : ''}
        </div>

        <div style={{ marginTop: '0.6rem', color: 'var(--gray-500)' }}>
          Statut: {match.status || (played ? 'finished' : 'scheduled')}
        </div>
      </div>
    </div>
  )
}
