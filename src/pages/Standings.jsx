import React, { useEffect, useState } from 'react'
import { getStandings, getMatches } from '../services/api.js'

function computeForm(teamId, matches) {
  const played = matches
    .filter(
      (m) =>
        (m.home_score != null && m.away_score != null) &&
        (m.home_team_id === teamId || m.away_team_id === teamId),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return played.map((m) => {
    const isHome = m.home_team_id === teamId
    const gs = isHome ? m.home_score : m.away_score
    const ga = isHome ? m.away_score : m.home_score
    if (gs > ga) return 'W'
    if (gs === ga) return 'D'
    return 'L'
  })
}

export default function Classement() {
  const [standings, setStandings] = useState([])
  const [matches, setMatches]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    Promise.all([
      getStandings(),
      getMatches().catch(() => ({ data: [] })),
    ])
      .then(([sRes, mRes]) => {
        setStandings(sRes.data)
        setMatches(mRes.data)
      })
      .catch(() => setError('Impossible de charger le classement.'))
      .finally(() => setLoading(false))
  }, [])

  const val = (s, ...keys) => {
    for (const k of keys) if (s[k] != null) return s[k]
    return 0
  }

  const zoneColor = (idx, total) => {
    if (idx === 0) return { bg: 'rgba(232,0,45,0.06)', border: 'var(--f1-red)' }
    if (idx <= 2) return { bg: 'rgba(255,135,0,0.05)', border: 'var(--f1-orange)' }
    if (idx >= total - 1) return { bg: 'rgba(100,100,120,0.05)', border: 'var(--gray-300)' }
    return null
  }

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
            Classement
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Championnat National LINAFP · Saison 2025-2026
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Zone legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { color: 'var(--f1-red)',    label: '1re place · Champion' },
            { color: 'var(--f1-orange)', label: '2e–3e · Podium' },
            { color: 'var(--gray-300)',  label: 'Dernière place' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: color, opacity: 0.7 }} />
              {label}
            </div>
          ))}
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Chargement du classement…</p></div>
        ) : standings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <p style={{ fontWeight: '600' }}>Classement indisponible.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '44px' }}>#</th>
                  <th>Équipe</th>
                  <th style={{ textAlign: 'center' }}>PJ</th>
                  <th style={{ textAlign: 'center' }}>V</th>
                  <th style={{ textAlign: 'center' }}>N</th>
                  <th style={{ textAlign: 'center' }}>D</th>
                  <th style={{ textAlign: 'center' }}>BP</th>
                  <th style={{ textAlign: 'center' }}>BC</th>
                  <th style={{ textAlign: 'center' }}>Diff</th>
                  <th style={{ textAlign: 'center' }}>Forme</th>
                  <th style={{ textAlign: 'center', background: 'var(--f1-red)' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => {
                  const zone = zoneColor(idx, standings.length)
                  const pj   = val(s, 'played')
                  const wins  = val(s, 'won')
                  const draws = val(s, 'drawn')
                  const loss  = val(s, 'lost')
                  const bp    = val(s, 'goals_for')
                  const bc    = val(s, 'goals_against')
                  const diff  = bp - bc
                  const pts   = val(s, 'points')
                  const name  = s.team_name || `Équipe ${s.team_id}`
                  const form  = computeForm(s.team_id, matches)

                  return (
                    <tr
                      key={s.team_id ?? idx}
                      style={zone ? { backgroundColor: zone.bg, borderLeft: `3px solid ${zone.border}` } : {}}
                    >
                      <td style={{ textAlign: 'center', fontWeight: '900', color: idx === 0 ? 'var(--f1-red)' : 'var(--gray-500)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--f1-dark)' }}>{name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{pj}</td>
                      <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>{wins}</td>
                      <td style={{ textAlign: 'center', color: 'var(--f1-orange)', fontWeight: '700' }}>{draws}</td>
                      <td style={{ textAlign: 'center', color: 'var(--f1-red)', fontWeight: '700' }}>{loss}</td>
                      <td style={{ textAlign: 'center' }}>{bp}</td>
                      <td style={{ textAlign: 'center' }}>{bc}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: diff > 0 ? '#16a34a' : diff < 0 ? 'var(--f1-red)' : 'var(--gray-500)' }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td>
                        <div className="form-guide" style={{ justifyContent: 'center' }}>
                          {form.length === 0
                            ? <span style={{ color: 'var(--gray-300)', fontSize: '0.7rem' }}>–</span>
                            : form.map((r, i) => (
                              <div key={i} className={`form-dot ${r}`} title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}>
                                {r}
                              </div>
                            ))
                          }
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: idx === 0 ? 'var(--f1-red)' : 'var(--f1-dark)',
                          color: '#fff', borderRadius: '99px',
                          padding: '0.2rem 0.65rem',
                          fontWeight: '900', fontSize: '0.9rem',
                          minWidth: '36px', textAlign: 'center',
                        }}>
                          {pts}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && standings.length > 0 && (
          <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--gray-500)' }}>
            PJ = Matchs joués · V = Victoires · N = Nuls · D = Défaites · BP = Buts pour · BC = Buts contre · Diff = Différence · Pts = Points
          </p>
        )}
      </div>
    </div>
  )
}
