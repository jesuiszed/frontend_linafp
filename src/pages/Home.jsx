import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getArticles, getStandings, getMatches, getStats } from '../services/api.js'

const CATEGORIES = [
  { key: '', label: 'Tout' },
  { key: 'news', label: 'Actualités' },
  { key: 'match', label: 'Matchs' },
  { key: 'transfert', label: 'Transferts' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatShort(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  })
}

function ArticleCard({ article, featured = false }) {
  const catLabel = CATEGORIES.find((c) => c.key === article.categorie)?.label || article.categorie

  if (featured) {
    return (
      <Link to={`/actualites/${article.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        position: 'relative', borderRadius: '16px', overflow: 'hidden',
        minHeight: '400px', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', background: 'var(--f1-dark)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}>
        {article.image_url && (
          <img src={article.image_url} alt={article.titre}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(21,21,30,0.97) 0%, rgba(21,21,30,0.2) 70%, transparent 100%)' }} />
        <div style={{ position: 'relative', padding: '2rem', zIndex: 1 }}>
          <span style={{
            display: 'inline-block', background: 'var(--f1-red)', color: '#fff',
            fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: '99px', marginBottom: '0.75rem',
          }}>{catLabel}</span>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '900', lineHeight: 1.25, marginBottom: '0.5rem' }}>
            {article.titre}
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{article.contenu}</p>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
            {article.auteur} · {formatDate(article.date_publication)}
          </span>
        </div>
      </div>
      </Link>
    )
  }

  return (
    <Link to={`/actualites/${article.id}`} className="article-card" style={{ textDecoration: 'none' }}>
      {article.image_url ? (
        <img className="article-card-img" src={article.image_url} alt={article.titre} />
      ) : (
        <div className="article-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', background: 'var(--f1-dark)', letterSpacing: '0.05em' }}>GFS</div>
      )}
      <div className="article-card-body">
        <span className="article-card-category">{catLabel}</span>
        <h3 className="article-card-title">{article.titre}</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.contenu}
        </p>
        <div className="article-card-meta">
          <span>{article.auteur}</span><span>·</span><span>{formatDate(article.date_publication)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Sidebar widgets ──────────────────────────────────────────────────────── */
function SidebarWidget({ title, to, children }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--f1-dark)', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        {to && <Link to={to} style={{ color: 'var(--f1-red)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tout voir →</Link>}
      </div>
      <div style={{ padding: '0.75rem 1rem' }}>{children}</div>
    </div>
  )
}

function StandingsMini({ standings }) {
  if (!standings.length) return <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', padding: '0.5rem 0' }}>Aucune donnée</p>
  return (
    <table style={{ fontSize: '0.82rem', width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'center', width: '24px', background: 'var(--f1-dark)', padding: '0.4rem' }}>#</th>
          <th style={{ background: 'var(--f1-dark)', color: '#fff', padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Équipe</th>
          <th style={{ background: 'var(--f1-dark)', color: '#fff', padding: '0.4rem', textAlign: 'center', fontWeight: '700', fontSize: '0.72rem' }}>PJ</th>
          <th style={{ background: 'var(--f1-dark)', color: '#fff', padding: '0.4rem', textAlign: 'center', fontWeight: '700', fontSize: '0.72rem' }}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings.slice(0, 6).map((s, i) => (
          <tr key={s.team_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
            <td style={{ textAlign: 'center', fontWeight: '700', color: i === 0 ? 'var(--f1-red)' : 'var(--gray-500)', padding: '0.4rem' }}>{i + 1}</td>
            <td style={{ fontWeight: '700', color: 'var(--f1-dark)', padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}>{s.team_name}</td>
            <td style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '0.4rem' }}>{s.played}</td>
            <td style={{ textAlign: 'center', padding: '0.4rem' }}>
              <span style={{ display: 'inline-block', background: i === 0 ? 'var(--f1-red)' : 'var(--f1-dark)', color: '#fff', borderRadius: '99px', padding: '0.1rem 0.5rem', fontWeight: '900', fontSize: '0.78rem' }}>{s.points}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MatchesMini({ matches }) {
  if (!matches.length) return <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', padding: '0.5rem 0' }}>Aucun résultat</p>
  const recent = [...matches]
    .filter((m) => m.home_score != null && m.away_score != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {recent.map((m) => {
        const hw = m.home_score > m.away_score
        const aw = m.away_score > m.home_score
        return (
          <div key={m.id} style={{ background: 'var(--gray-100)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
              {formatShort(m.date)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: hw ? '800' : '500', fontSize: '0.8rem', color: hw ? 'var(--f1-dark)' : 'var(--gray-500)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.home_team?.nom || `Éq.${m.home_team_id}`}
              </span>
              <span style={{ background: 'var(--f1-dark)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '900', fontSize: '0.88rem', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {m.home_score}–{m.away_score}
              </span>
              <span style={{ fontWeight: aw ? '800' : '500', fontSize: '0.8rem', color: aw ? 'var(--f1-dark)' : 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.away_team?.nom || `Éq.${m.away_team_id}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UpcomingMini({ matches }) {
  const upcoming = [...matches]
    .filter((m) => m.home_score == null || m.away_score == null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  if (!upcoming.length) return <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', padding: '0.5rem 0' }}>Aucun match à venir</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {upcoming.map((m) => (
        <div key={m.id} style={{ background: 'var(--gray-100)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--f1-red)', marginBottom: '0.25rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {formatShort(m.date)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--f1-dark)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.home_team?.nom || `Éq.${m.home_team_id}`}
            </span>
            <span style={{ background: 'var(--gray-300)', color: 'var(--gray-700)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              VS
            </span>
            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--f1-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.away_team?.nom || `Éq.${m.away_team_id}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TopScorersMini({ scorers }) {
  if (!scorers || !scorers.length) return <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', padding: '0.5rem 0' }}>Aucun buteur</p>
  return (
    <div>
      {scorers.slice(0, 5).map((s, i) => (
        <div key={s.player_id} className="scorer-row" style={{ padding: '0.5rem 0' }}>
          <div className={`scorer-rank${i === 0 ? ' top1' : i < 3 ? ' top3' : ''}`}>{i + 1}</div>
          <div className="scorer-avatar" style={{ width: '36px', height: '36px', fontSize: '0.7rem', fontWeight: '700' }}>{i + 1}</div>
          <div className="scorer-info">
            <div className="scorer-name" style={{ fontSize: '0.82rem' }}>{s.player_name}</div>
            <div className="scorer-team" style={{ fontSize: '0.72rem' }}>{s.team_name}</div>
          </div>
          <div className="scorer-goals" style={{ fontSize: '0.82rem', padding: '0.15rem 0.55rem' }}>{s.goals}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Main Home page ───────────────────────────────────────────────────────── */
export default function Home() {
  const [articles, setArticles]   = useState([])
  const [standings, setStandings] = useState([])
  const [matches, setMatches]     = useState([])
  const [stats, setStats]         = useState(null)
  const [activeCat, setActiveCat] = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getArticles(),
      getStandings().catch(() => ({ data: [] })),
      getMatches().catch(() => ({ data: [] })),
      getStats().catch(() => ({ data: null })),
    ]).then(([artRes, standRes, matchRes, statsRes]) => {
      setArticles(artRes.data)
      setStandings(standRes.data)
      setMatches(matchRes.data)
      setStats(statsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = activeCat
    ? articles.filter((a) => a.categorie === activeCat)
    : articles

  const featured = filtered[0]
  const rest     = filtered.slice(1)
  const topScorers = stats?.top_scorers || []

  return (
    <div style={{ flex: 1, background: 'var(--off-white)' }}>
      {/* Hero */}
      <div className="home-hero" style={{ padding: '3.5rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(232,0,45,0.18)', border: '1px solid rgba(232,0,45,0.4)',
            borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
          }}>
            <span style={{ color: 'var(--f1-red)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Championnat National · Saison 2025-2026
            </span>
          </div>
          <h1 style={{
            color: '#fff', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '900', lineHeight: 1.1, textTransform: 'uppercase',
            letterSpacing: '0.02em', marginBottom: '0.75rem',
          }}>
            Gabon<span style={{ color: 'var(--f1-red)' }}>Foot</span>Stats
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem', maxWidth: '540px', lineHeight: 1.6 }}>
            Toute l'actualité, les résultats, le classement et les statistiques du championnat national du Gabon.
          </p>

          {/* Quick stats strip */}
          {!loading && standings.length > 0 && (
            <div style={{
              display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Leader', value: standings[0]?.team_name || '–' },
                { label: 'Matchs joués', value: Math.round(standings.reduce((a, s) => a + s.played, 0) / 2) },
                { label: 'Clubs', value: standings.length },
                { label: 'Meilleur buteur', value: topScorers[0] ? `${topScorers[0].player_name} (${topScorers[0].goals} buts)` : '–' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', padding: '0.6rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '800' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1280px', margin: '-2.5rem auto 0', padding: '0 1.5rem 4rem', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}
          className="home-grid">

          {/* ── Articles column ── */}
          <div>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {CATEGORIES.map((c) => (
                <button key={c.key} className={`cat-pill${activeCat === c.key ? ' active' : ''}`} onClick={() => setActiveCat(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="loading-container"><div className="spinner" /><p>Chargement des actualités…</p></div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--gray-500)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>GFS</div>
                <p style={{ fontWeight: '700' }}>Aucun article pour cette catégorie.</p>
              </div>
            ) : (
              <>
                {featured && <div style={{ marginBottom: '1.5rem' }}><ArticleCard article={featured} featured /></div>}
                {rest.length > 0 && (
                  <>
                    <div className="section-title" style={{ marginBottom: '1rem' }}>Dernières actualités</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                      {rest.map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SidebarWidget title="Classement" to="/classement">
              <StandingsMini standings={standings} />
            </SidebarWidget>

            <SidebarWidget title="Prochains matchs" to="/resultats">
              <UpcomingMini matches={matches} />
            </SidebarWidget>

            <SidebarWidget title="Derniers résultats" to="/resultats">
              <MatchesMini matches={matches} />
            </SidebarWidget>

            <SidebarWidget title="Buteurs" to="/joueurs">
              <TopScorersMini scorers={topScorers} />
            </SidebarWidget>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .home-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

