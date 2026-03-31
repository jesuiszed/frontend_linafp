import React, { useEffect, useState } from 'react'
import { getStats, getStandings } from '../services/api.js'

function BarSection({ title, items, valueKey, labelKey, colorClass = 'var(--f1-red)' }) {
  if (!items || !items.length) return null
  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1)
  return (
    <div className="stat-block" style={{ marginBottom: '1.5rem' }}>
      <div className="stat-block-header">
        <span className="stat-block-title">{title}</span>
      </div>
      {items.slice(0, 10).map((item, i) => (
        <div key={i} className="stat-team-bar">
          <span className="stat-team-name">{item[labelKey]}</span>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, background: colorClass }}
            />
          </div>
          <span className="stat-bar-value">{item[valueKey] || 0}</span>
        </div>
      ))}
    </div>
  )
}

function ScorerSection({ scorers }) {
  if (!scorers || !scorers.length) return null
  return (
    <div className="stat-block" style={{ marginBottom: '1.5rem' }}>
      <div className="stat-block-header">
        <span className="stat-block-title">Classement des buteurs</span>
      </div>
      {scorers.slice(0, 10).map((s, i) => (
        <div key={s.player_id} className="scorer-row">
          <div className={`scorer-rank${i === 0 ? ' top1' : i < 3 ? ' top3' : ''}`}>{i + 1}</div>
          <div className="scorer-avatar">J</div>
          <div className="scorer-info">
            <div className="scorer-name">{s.player_name}</div>
            <div className="scorer-team">{s.team_name}</div>
          </div>
          <div className="scorer-goals">{s.goals} buts</div>
        </div>
      ))}
    </div>
  )
}

export default function Statistiques() {
  const [stats, setStats]       = useState(null)
  const [standings, setStandings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('scorers')

  useEffect(() => {
    Promise.all([
      getStats().catch(() => ({ data: null })),
      getStandings().catch(() => ({ data: [] })),
    ]).then(([sRes, stRes]) => {
      setStats(sRes.data)
      setStandings(stRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const topScorers = stats?.top_scorers || []
  const teamsGoals = stats?.teams_goals || []
  const teamsGoalsAgainst = [...teamsGoals].sort((a, b) => a.goals_against - b.goals_against)

  const mostWins   = [...standings].sort((a, b) => (b.won || 0) - (a.won || 0))
    .map((s) => ({ name: s.team_name, wins: s.won || 0 }))
  const cleanSheets = [...standings].sort((a, b) => (a.goals_against || 0) - (b.goals_against || 0))
    .map((s) => ({ name: s.team_name, gc: s.goals_against || 0 }))

  const tabs = [
    { key: 'scorers',   label: 'Buteurs' },
    { key: 'goals_for', label: 'Buts marqués' },
    { key: 'goals_against', label: 'Buts encaissés' },
    { key: 'wins',      label: 'Victoires' },
  ]

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
            Statistiques
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Classements individuels et performances des équipes · Saison 2025-2026
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Tabs */}
        <div className="tab-bar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Chargement…</p></div>
        ) : (
          <div style={{ maxWidth: '720px' }}>
            {tab === 'scorers' && <ScorerSection scorers={topScorers} />}
            {tab === 'goals_for' && (
              <BarSection
                title="Buts marqués par équipe"
                items={teamsGoals.map((t) => ({ name: t.team_name, goals: t.goals_for }))}
                valueKey="goals"
                labelKey="name"
                colorClass="var(--f1-red)"
              />
            )}
            {tab === 'goals_against' && (
              <BarSection
                title="Buts encaissés par équipe (moins = mieux)"
                items={teamsGoalsAgainst.map((t) => ({ name: t.team_name, goals: t.goals_against }))}
                valueKey="goals"
                labelKey="name"
                colorClass="var(--f1-dark)"
              />
            )}
            {tab === 'wins' && (
              <BarSection
                title="Victoires par équipe"
                items={mostWins.map((s) => ({ name: s.name, wins: s.wins }))}
                valueKey="wins"
                labelKey="name"
                colorClass="var(--f1-orange)"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
