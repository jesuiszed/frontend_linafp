import React, { useEffect, useState } from 'react'
import { getMatches } from '../services/api.js'

function formatScore(m) {
  return `${m.home_team?.nom || `Éq.${m.home_team_id}`}  ${m.home_score}–${m.away_score}  ${m.away_team?.nom || `Éq.${m.away_team_id}`}`
}

export default function ScoresTicker() {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    getMatches()
      .then((r) => {
        const played = r.data.filter(
          (m) => m.home_score != null && m.away_score != null,
        )
        setMatches(played)
      })
      .catch(() => {})
  }, [])

  if (!matches.length) return null

  // Duplicate items so the scroll loop is seamless
  const items = [...matches, ...matches]

  return (
    <div className="ticker-bar">
      <div className="ticker-label">Résultats</div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-inner">
          {items.map((m, i) => (
            <div key={i} className="ticker-item">
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                {m.home_team?.nom || `Éq.${m.home_team_id}`}
              </span>
              <span className="ticker-score">
                {m.home_score} – {m.away_score}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                {m.away_team?.nom || `Éq.${m.away_team_id}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
