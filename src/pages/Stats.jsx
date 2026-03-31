import React, { useEffect, useState } from 'react'
import { getStats } from '../services/api.js'

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  marginBottom: '2rem',
}

const sectionHeaderStyle = {
  background: 'linear-gradient(135deg, #009A44 0%, #007a35 100%)',
  padding: '1rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const sectionTitleStyle = {
  color: '#ffffff',
  fontSize: '1.05rem',
  fontWeight: '700',
  margin: 0,
}

export default function Stats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement des statistiques…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-box">{error}</div>
      </div>
    )
  }

  // Normalise top scorers – API may return various shapes
  const topScorers = (() => {
    const raw = stats?.top_scorers ?? stats?.top_buteurs ?? stats?.scorers ?? []
    return Array.isArray(raw) ? raw : []
  })()

  // Normalise goals per team
  const teamGoals = (() => {
    const raw = stats?.team_goals ?? stats?.buts_par_equipe ?? stats?.goals_per_team ?? []
    return Array.isArray(raw) ? raw : []
  })()

  const noData = topScorers.length === 0 && teamGoals.length === 0

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><span>Statistiques</span></h1>
      </div>

      {noData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontWeight: '600' }}>Aucune statistique disponible pour l'instant.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Les statistiques apparaîtront après l'enregistrement des matchs et des joueurs.
          </p>
        </div>
      ) : (
        <>
          {/* Top Scorers */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Meilleurs buteurs</h2>
            </div>
            {topScorers.length === 0 ? (
              <p style={{ padding: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Aucun buteur enregistré.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>Rang</th>
                    <th>Joueur</th>
                    <th>Équipe</th>
                    <th style={{ textAlign: 'center' }}>Buts</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((s, idx) => {
                    const name  = s.player_name ?? s.nom ?? s.name ?? '–'
                    const team  = s.team_name ?? s.equipe ?? s.team ?? '–'
                    const goals = s.goals ?? s.buts ?? 0
                    const rankIcons = ['1er', '2e', '3e']

                    return (
                      <tr key={idx} style={idx < 3 ? { fontWeight: '700' } : {}}>
                        <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                          {rankIcons[idx] ?? (
                            <span style={{ color: '#6b7280', fontWeight: '600' }}>{idx + 1}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: idx < 3 ? '700' : '500', color: '#111827' }}>{name}</td>
                        <td>
                          <span className="badge badge-green">{team}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: idx === 0 ? '#FCD116' : idx === 1 ? '#e5e7eb' : idx === 2 ? '#ffedd5' : '#e6f7ee',
                            color: idx === 0 ? '#78350f' : idx === 1 ? '#374151' : idx === 2 ? '#9a3412' : '#009A44',
                            borderRadius: '99px',
                            padding: '0.2rem 0.7rem',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            minWidth: '40px',
                            textAlign: 'center',
                          }}>
                            {goals} buts
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Goals per team */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Buts par équipe</h2>
            </div>
            {teamGoals.length === 0 ? (
              <p style={{ padding: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Aucune donnée de buts disponible.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Équipe</th>
                    <th style={{ textAlign: 'center' }}>Buts marqués</th>
                    <th style={{ textAlign: 'center' }}>Buts encaissés</th>
                    <th style={{ textAlign: 'center' }}>Différence</th>
                  </tr>
                </thead>
                <tbody>
                  {teamGoals.map((t, idx) => {
                    const name = t.team_name ?? t.equipe ?? t.nom ?? `Équipe ${idx + 1}`
                    const scored   = t.goals_for ?? t.buts_marques ?? t.scored ?? 0
                    const conceded = t.goals_against ?? t.buts_encaisses ?? t.conceded ?? 0
                    const diff = scored - conceded

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: '700', color: '#111827' }}>{name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#e6f7ee', color: '#009A44',
                            borderRadius: '99px', padding: '0.2rem 0.7rem',
                            fontWeight: '700', fontSize: '0.875rem',
                          }}>
                            {scored}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#fee2e2', color: '#dc2626',
                            borderRadius: '99px', padding: '0.2rem 0.7rem',
                            fontWeight: '700', fontSize: '0.875rem',
                          }}>
                            {conceded}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700',
                          color: diff > 0 ? '#009A44' : diff < 0 ? '#dc2626' : '#6b7280' }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
