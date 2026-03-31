import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers, getTeams } from '../services/api.js'

const POSTES = [
  { key: '', label: 'Tous' },
  { key: 'Gardien', label: 'Gardiens' },
  { key: 'Défenseur', label: 'Défenseurs' },
  { key: 'Milieu', label: 'Milieux' },
  { key: 'Attaquant', label: 'Attaquants' },
]

const POSTE_ICON = {
  Gardien: 'G', Défenseur: 'D', Milieu: 'M', Attaquant: 'A',
}

export default function Joueurs() {
  const [players, setPlayers]   = useState([])
  const [teams, setTeams]       = useState([])
  const [filterPos, setFilterPos] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('scorers') // scorers | all
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getPlayers(), getTeams().catch(() => ({ data: [] }))])
      .then(([pRes, tRes]) => {
        setPlayers(pRes.data)
        setTeams(tRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const teamName = (id) => teams.find((t) => t.id === id)?.nom || `Éq.${id}`

  const visible = players
    .filter((p) => !filterPos || p.poste === filterPos)
    .filter((p) => !filterTeam || p.team_id === Number(filterTeam))
    .filter((p) => !search || p.nom.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => tab === 'scorers' ? b.goals - a.goals : a.nom.localeCompare(b.nom))

  const topOnly = tab === 'scorers' ? visible.filter((p) => p.goals > 0) : visible

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
            Joueurs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Buteurs, effectifs et statistiques individuelles
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab-btn${tab === 'scorers' ? ' active' : ''}`} onClick={() => setTab('scorers')}>
            Buteurs
          </button>
          <button className={`tab-btn${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>
            Tous les joueurs
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '240px', fontSize: '0.875rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {POSTES.map((pos) => (
              <button
                key={pos.key}
                className={`cat-pill${filterPos === pos.key ? ' active' : ''}`}
                onClick={() => setFilterPos(pos.key)}
              >
                {pos.label}
              </button>
            ))}
          </div>
          {teams.length > 0 && (
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              style={{ maxWidth: '200px', fontSize: '0.875rem' }}
            >
              <option value="">Tous les clubs</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Chargement…</p></div>
        ) : topOnly.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
            <p style={{ fontWeight: '700', marginTop: '1rem' }}>
              {tab === 'scorers' ? 'Aucun buteur enregistré.' : 'Aucun joueur trouvé.'}
            </p>
          </div>
        ) : tab === 'scorers' ? (
          /* ── Top scorers list ── */
          <div className="stat-block">
            <div className="stat-block-header">
              <span className="stat-block-title">Classement des buteurs</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                {topOnly.length} joueur{topOnly.length !== 1 ? 's' : ''}
              </span>
            </div>
            {topOnly.map((p, i) => (
              <div key={p.id} className="scorer-row">
                <div className={`scorer-rank${i === 0 ? ' top1' : i < 3 ? ' top3' : ''}`}>
                  {i + 1}
                </div>
                <div className="scorer-avatar">
                  {POSTE_ICON[p.poste] || 'J'}
                </div>
                <div className="scorer-info">
                  <div className="scorer-name"><Link to={`/joueurs/${p.id}`} style={{ color: 'inherit' }}>{p.nom}</Link></div>
                  <div className="scorer-team">
                    {p.poste} · {p.team?.nom || teamName(p.team_id)}
                  </div>
                </div>
                <div className="scorer-goals">{p.goals} buts</div>
              </div>
            ))}
          </div>
        ) : (
          /* ── All players table ── */
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Joueur</th>
                  <th>Poste</th>
                  <th>Club</th>
                  <th style={{ textAlign: 'center' }}>N°</th>
                  <th style={{ textAlign: 'center' }}>Age</th>
                  <th style={{ textAlign: 'center' }}>Nationalité</th>
                  <th style={{ textAlign: 'center' }}>Buts</th>
                </tr>
              </thead>
              <tbody>
                {topOnly.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--gray-500)', width: '40px' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to={`/joueurs/${p.id}`} style={{ fontWeight: '700', color: 'var(--f1-dark)' }}>{p.nom}</Link>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${p.poste === 'Attaquant' ? 'green' : p.poste === 'Gardien' ? 'yellow' : 'blue'}`}>
                        {p.poste}
                      </span>
                    </td>
                    <td>{p.team?.nom || teamName(p.team_id)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{p.numero ?? '–'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{p.age ?? '–'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{p.nationalite || '–'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.goals > 0 ? (
                        <span style={{
                          background: 'var(--f1-red)', color: '#fff',
                          borderRadius: '99px', padding: '0.15rem 0.6rem',
                          fontWeight: '800', fontSize: '0.8rem',
                        }}>{p.goals}</span>
                      ) : <span style={{ color: 'var(--gray-300)' }}>0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
