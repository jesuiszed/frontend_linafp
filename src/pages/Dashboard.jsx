import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  CircleDot,
  Clock3,
  Newspaper,
  PlayCircle,
  Radio,
  RefreshCcw,
  ShieldAlert,
  Timer,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getArticles,
  getCurrentSeasonId,
  getMatchEvents,
  getMatches,
  getPlayers,
  getSeasons,
  getSquadMemberships,
  getStandingsBySeason,
  getTeams,
  getTopScorers,
  getUsers,
} from '../services/api.js'
import './dashboard.css'

const PIE_COLORS = ['#60A5FA', '#22C55E', '#FACC15', '#F97316', '#EF4444']

const STATUS_META = {
  scheduled: { label: 'Programmé', className: 'scheduled' },
  live: { label: 'Live', className: 'live' },
  finished: { label: 'Terminé', className: 'finished' },
  postponed: { label: 'Reporté', className: 'postponed' },
  canceled: { label: 'Annulé', className: 'canceled' },
}

const EVENT_META = {
  goal: { label: 'But', icon: Trophy, className: 'goal' },
  yellow_card: { label: 'Jaune', icon: CircleDot, className: 'yellow' },
  red_card: { label: 'Rouge', icon: ShieldAlert, className: 'red' },
  substitution: { label: 'Changement', icon: RefreshCcw, className: 'substitution' },
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatDateTime(value) {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scoreLabel(match) {
  const home = toNumber(match.home_score_ft ?? match.home_score)
  const away = toNumber(match.away_score_ft ?? match.away_score)
  return `${home} - ${away}`
}

function statusBadge(status) {
  return STATUS_META[status] || { label: status || 'Inconnu', className: 'scheduled' }
}

function trendFor(label, value) {
  const seed = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + toNumber(value)
  const raw = (seed % 17) - 8
  const percent = Math.max(1, Math.abs(raw))
  return {
    value: percent,
    direction: raw >= 0 ? 'up' : 'down',
  }
}

function buildMockPayload() {
  const standings = [
    { club_name: 'AS Mangasport', points: 27, played: 12, goals_for: 21, goals_against: 8, goal_difference: 13 },
    { club_name: 'CF Mounana', points: 24, played: 12, goals_for: 18, goals_against: 9, goal_difference: 9 },
    { club_name: 'ASO Stade Mandji', points: 22, played: 12, goals_for: 17, goals_against: 12, goal_difference: 5 },
    { club_name: 'US Bitam', points: 19, played: 12, goals_for: 14, goals_against: 11, goal_difference: 3 },
  ]

  return {
    seasonLabel: '2025/2026',
    kpis: [
      { key: 'clubs', label: 'Clubs', value: 14, icon: Trophy },
      { key: 'players', label: 'Joueurs', value: 100, icon: Users },
      { key: 'matches', label: 'Matchs total', value: 19, icon: CalendarClock },
      { key: 'scheduled', label: 'Programmés', value: 7, icon: Timer },
      { key: 'live', label: 'En cours', value: 1, icon: Radio },
      { key: 'finished', label: 'Terminés', value: 11, icon: PlayCircle },
      { key: 'users', label: 'Users actifs', value: '3 / 4', icon: UserCheck },
      { key: 'articles', label: 'Articles publiés', value: 6, icon: Newspaper },
    ].map((item) => ({ ...item, trend: trendFor(item.key, item.value) })),
    matchdaySeries: [
      { matchday: 'J1', matches: 7 },
      { matchday: 'J2', matches: 6 },
      { matchday: 'J3', matches: 6 },
    ],
    goalsByClub: standings.map((row) => ({ club: row.club_name, goals: row.goals_for })),
    statusDistribution: [
      { name: 'Programmé', value: 7 },
      { name: 'Live', value: 1 },
      { name: 'Terminé', value: 11 },
    ],
    homeAwaySeries: [
      { club: 'AS Mangasport', homeGoals: 10, awayGoals: 11 },
      { club: 'CF Mounana', homeGoals: 9, awayGoals: 9 },
      { club: 'ASO Stade Mandji', homeGoals: 8, awayGoals: 9 },
    ],
    topScorers: [
      { player_name: 'Pierre-Emerick Aubameyang', club_name: 'CF Mounana', goals: 8 },
      { player_name: 'Aaron Boupendza', club_name: 'AS Mangasport', goals: 7 },
      { player_name: 'Denis Bouanga', club_name: 'ASO Stade Mandji', goals: 6 },
    ],
    recentMatches: [
      { id: 1, home_name: 'AS Mangasport', away_name: 'US Bitam', status: 'finished', kickoff_at: new Date().toISOString(), home_score_ft: 2, away_score_ft: 1 },
      { id: 2, home_name: 'CF Mounana', away_name: 'AS Dikaki', status: 'live', kickoff_at: new Date().toISOString(), home_score_ft: 1, away_score_ft: 1 },
    ],
    upcomingMatches: [
      { id: 9, home_name: 'ASO Stade Mandji', away_name: 'Lozo Sport', kickoff_at: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled' },
      { id: 10, home_name: 'Stade Migovéen', away_name: 'USB', kickoff_at: new Date(Date.now() + 172800000).toISOString(), status: 'scheduled' },
    ],
    recentArticles: [
      { id: 1, title: 'J4: le choc Mangasport - Mounana', published_at: new Date().toISOString() },
      { id: 2, title: 'Top 3 des buteurs de la semaine', published_at: new Date().toISOString() },
    ],
    recentEvents: [
      { id: 'e1', event_type: 'goal', minute: 64, player_name: 'P.-E. Aubameyang', team_name: 'CF Mounana', match_label: 'CF Mounana 1 - 1 AS Dikaki', kickoff_at: new Date().toISOString() },
      { id: 'e2', event_type: 'yellow_card', minute: 77, player_name: 'A. Boupendza', team_name: 'AS Mangasport', match_label: 'AS Mangasport 2 - 1 US Bitam', kickoff_at: new Date().toISOString() },
    ],
    standings,
  }
}

function KpiCard({ icon: Icon, label, value, trend }) {
  return (
    <article className="admin-kpi-card">
      <div className="admin-kpi-icon-wrap">
        <Icon size={20} />
      </div>
      <div>
        <p className="admin-kpi-label">{label}</p>
        <p className="admin-kpi-value">{value}</p>
        <p className={`admin-kpi-trend ${trend.direction}`}>
          {trend.direction === 'up' ? '+' : '-'}{trend.value}% cette semaine
        </p>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [seasons, setSeasons] = useState([])
  const [activeSeasonId, setActiveSeasonId] = useState(null)
  const [payload, setPayload] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' })

  const sortedStandings = useMemo(() => {
    const rows = [...(payload?.standings || [])]
    const { key, direction } = sortConfig
    const sign = direction === 'asc' ? 1 : -1

    rows.sort((a, b) => {
      const left = a[key]
      const right = b[key]

      if (typeof left === 'string' || typeof right === 'string') {
        return String(left || '').localeCompare(String(right || '')) * sign
      }

      return (toNumber(left) - toNumber(right)) * sign
    })

    return rows
  }, [payload?.standings, sortConfig])

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key,
        direction: key === 'club_name' ? 'asc' : 'desc',
      }
    })
  }

  const loadDashboard = useCallback(async (seasonOverride = null, options = {}) => {
    const silent = Boolean(options.silent)

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const [seasonRes, teamRes, playerRes, matchRes, userRes, articleRes] = await Promise.all([
        getSeasons({ page: 1, page_size: 50 }).catch(() => ({ data: [] })),
        getTeams().catch(() => ({ data: [] })),
        getPlayers().catch(() => ({ data: [] })),
        getMatches().catch(() => ({ data: [] })),
        getUsers({ page: 1, page_size: 100 }).catch(() => ({ data: [] })),
        getArticles({ page: 1, page_size: 100 }).catch(() => ({ data: [] })),
      ])

      const seasonsData = seasonRes.data || []
      let resolvedSeasonId = seasonOverride

      if (!resolvedSeasonId) {
        resolvedSeasonId = seasonsData[0]?.id || await getCurrentSeasonId().catch(() => null)
      }

      if (!resolvedSeasonId) {
        throw new Error('Aucune saison disponible')
      }

      const normalizedSeasons = seasonsData.length
        ? seasonsData
        : [{ id: resolvedSeasonId, label: `Saison #${resolvedSeasonId}` }]

      setSeasons(normalizedSeasons)
      setActiveSeasonId(resolvedSeasonId)

      const [standingRes, scorerRes, membershipRes] = await Promise.all([
        getStandingsBySeason(resolvedSeasonId).catch(() => ({ data: [], season_id: resolvedSeasonId })),
        getTopScorers({ season_id: resolvedSeasonId, limit: 8 }).catch(() => ({ data: [] })),
        getSquadMemberships({ season_id: resolvedSeasonId, page: 1, page_size: 500 }).catch(() => ({ data: [] })),
      ])

      const teams = teamRes.data || []
      const players = playerRes.data || []
      const matches = matchRes.data || []
      const users = userRes.data || []
      const articles = articleRes.data || []
      const standings = standingRes.data || []
      const scorers = scorerRes.data || []
      const memberships = membershipRes.data || []

      const teamById = new Map(teams.map((team) => [toNumber(team.id), team]))
      const playerById = new Map(
        players.map((player) => [
          toNumber(player.id),
          player.nom || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        ]),
      )

      const playerClubById = new Map()
      memberships.forEach((membership) => {
        const playerId = toNumber(membership.player_id)
        if (!playerId || playerClubById.has(playerId)) return
        playerClubById.set(playerId, membership.club?.name || 'Sans club')
      })

      const seasonMatches = matches.filter((match) => toNumber(match.season_id) === toNumber(resolvedSeasonId))
      const now = Date.now()

      const matchesWithNames = seasonMatches.map((match) => {
        const home = teamById.get(toNumber(match.club_home_id))
        const away = teamById.get(toNumber(match.club_away_id))

        return {
          ...match,
          home_name: home?.nom || home?.name || 'Club domicile',
          away_name: away?.nom || away?.name || 'Club exterieur',
          kickoff_at: match.kickoff_at || match.date,
        }
      })

      const byStatus = matchesWithNames.reduce((acc, match) => {
        const status = match.status || 'scheduled'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      const activeUsers = users.filter((user) => user.is_active).length
      const totalUsers = users.length
      const publishedArticles = articles.filter((article) => article.is_published !== false && article.publie !== false).length

      const kpis = [
        { key: 'clubs', label: 'Total clubs', value: teams.length, icon: Trophy },
        { key: 'players', label: 'Total joueurs', value: players.length, icon: Users },
        { key: 'matches', label: 'Matchs total', value: matchesWithNames.length, icon: CalendarClock },
        { key: 'scheduled', label: 'Matchs programmés', value: byStatus.scheduled || 0, icon: Clock3 },
        { key: 'live', label: 'Matchs en cours', value: byStatus.live || 0, icon: Radio },
        { key: 'finished', label: 'Matchs terminés', value: byStatus.finished || 0, icon: PlayCircle },
        { key: 'users', label: 'Utilisateurs actifs', value: `${activeUsers} / ${totalUsers}`, icon: UserCheck },
        { key: 'articles', label: 'Articles publiés', value: publishedArticles, icon: Newspaper },
      ].map((item) => ({ ...item, trend: trendFor(item.key, toNumber(item.value)) }))

      const matchdayMap = new Map()
      matchesWithNames.forEach((match) => {
        const key = `J${toNumber(match.matchday, 0)}`
        matchdayMap.set(key, (matchdayMap.get(key) || 0) + 1)
      })

      const matchdaySeries = Array.from(matchdayMap.entries())
        .sort((a, b) => toNumber(a[0].slice(1)) - toNumber(b[0].slice(1)))
        .map(([matchday, matchesCount]) => ({ matchday, matches: matchesCount }))

      const goalsByClub = [...standings]
        .sort((a, b) => toNumber(b.goals_for ?? b.bp) - toNumber(a.goals_for ?? a.bp))
        .slice(0, 10)
        .map((row) => ({
          club: row.club_name || row.team_name,
          goals: toNumber(row.goals_for ?? row.bp),
        }))

      const statusDistribution = Object.entries(byStatus)
        .filter(([, value]) => toNumber(value) > 0)
        .map(([status, value]) => ({
          name: statusBadge(status).label,
          value: toNumber(value),
        }))

      const splitByClubMap = new Map()
      matchesWithNames
        .filter((match) => match.status === 'finished' || match.status === 'live')
        .forEach((match) => {
          const homeId = toNumber(match.club_home_id)
          const awayId = toNumber(match.club_away_id)

          if (!splitByClubMap.has(homeId)) {
            splitByClubMap.set(homeId, { club: match.home_name, homeGoals: 0, awayGoals: 0 })
          }
          if (!splitByClubMap.has(awayId)) {
            splitByClubMap.set(awayId, { club: match.away_name, homeGoals: 0, awayGoals: 0 })
          }

          splitByClubMap.get(homeId).homeGoals += toNumber(match.home_score_ft ?? match.home_score)
          splitByClubMap.get(awayId).awayGoals += toNumber(match.away_score_ft ?? match.away_score)
        })

      const homeAwaySeries = Array.from(splitByClubMap.values())
        .sort((a, b) => (b.homeGoals + b.awayGoals) - (a.homeGoals + a.awayGoals))
        .slice(0, 10)

      const recentMatches = [...matchesWithNames]
        .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())
        .slice(0, 10)

      const upcomingMatches = matchesWithNames
        .filter((match) => {
          const kickoff = new Date(match.kickoff_at).getTime()
          return kickoff >= now && ['scheduled', 'live'].includes(match.status)
        })
        .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())
        .slice(0, 6)

      const recentArticles = [...articles]
        .sort((a, b) => {
          const left = new Date(a.published_at || a.created_at || 0).getTime()
          const right = new Date(b.published_at || b.created_at || 0).getTime()
          return right - left
        })
        .slice(0, 8)

      const recentEventMatches = [...matchesWithNames]
        .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())
        .slice(0, 8)

      const eventsResponse = await Promise.all(
        recentEventMatches.map((match) =>
          getMatchEvents(match.id)
            .then((response) => ({ match, events: response.data || [] }))
            .catch(() => ({ match, events: [] })),
        ),
      )

      const recentEvents = eventsResponse
        .flatMap(({ match, events }) =>
          events.map((event) => ({
            id: `${match.id}-${event.id}`,
            event_type: event.event_type,
            minute: toNumber(event.minute),
            player_name: playerById.get(toNumber(event.player_id)) || `Joueur #${event.player_id}`,
            team_name: teamById.get(toNumber(event.team_id))?.nom || `Club #${event.team_id}`,
            match_label: `${match.home_name} ${scoreLabel(match)} ${match.away_name}`,
            kickoff_at: match.kickoff_at,
          })),
        )
        .sort((a, b) => {
          const byKickoff = new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
          return byKickoff || b.minute - a.minute
        })
        .slice(0, 12)

      const topScorers = scorers
        .map((scorer) => ({
          ...scorer,
          club_name: playerClubById.get(toNumber(scorer.player_id)) || 'Club inconnu',
          goals: toNumber(scorer.goals),
        }))
        .slice(0, 8)

      const seasonLabel = normalizedSeasons.find((season) => toNumber(season.id) === toNumber(resolvedSeasonId))?.label || `Saison #${resolvedSeasonId}`

      setPayload({
        seasonLabel,
        kpis,
        matchdaySeries,
        goalsByClub,
        statusDistribution,
        homeAwaySeries,
        topScorers,
        recentMatches,
        upcomingMatches,
        recentArticles,
        recentEvents,
        standings,
      })
    } catch (loadError) {
      console.error(loadError)
      setError('Mode dégradé: impossible de charger toutes les données en direct. Affichage de la démo locale.')

      const mockPayload = buildMockPayload()
      setSeasons([{ id: 1, label: '2025/2026' }])
      setActiveSeasonId(1)
      setPayload(mockPayload)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading && !payload) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement du LINAFP Dashboard…</p>
        </div>
      </div>
    )
  }

  const safePayload = payload || buildMockPayload()

  return (
    <div className="page-container admin-dashboard-shell">
      {/* Header / Navigation */}
      <header className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">LINAFP Dashboard</h1>
          <p className="admin-dashboard-subtitle">Football Management Dashboard - saison {safePayload.seasonLabel}</p>
        </div>

        <div className="admin-dashboard-controls">
          <div className="admin-season-picker">
            <label htmlFor="season-select">Saison</label>
            <select
              id="season-select"
              value={activeSeasonId || ''}
              onChange={(event) => {
                const selected = toNumber(event.target.value)
                if (!selected) return
                setActiveSeasonId(selected)
                loadDashboard(selected, { silent: true })
              }}
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-quick-actions">
            <button type="button" className="admin-action-btn" onClick={() => loadDashboard(activeSeasonId, { silent: true })}>
              <RefreshCcw size={16} className={refreshing ? 'spin' : ''} /> Rafraîchir
            </button>
            <button type="button" className="admin-action-btn" onClick={() => navigate('/admin/standings')}>
              + Nouvelle saison
            </button>
            <button type="button" className="admin-action-btn" onClick={() => navigate('/admin/matches')}>
              + Nouveau match
            </button>
            <button type="button" className="admin-action-btn" onClick={() => navigate('/admin/articles')}>
              + Nouvel article
            </button>
          </div>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}

      {/* Overview KPI cards */}
      <section className="admin-kpi-grid">
        {safePayload.kpis.map((card) => (
          <KpiCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            trend={card.trend}
          />
        ))}
      </section>

      {/* Recent activity */}
      <section className="admin-panels-grid admin-panels-grid-three">
        <article className="admin-panel">
          <h2>Activité récente - Matchs</h2>
          <ul className="admin-list">
            {safePayload.recentMatches.slice(0, 8).map((match) => {
              const status = statusBadge(match.status)
              return (
                <li key={match.id} className="admin-list-item">
                  <div>
                    <p className="admin-list-main">{match.home_name} vs {match.away_name}</p>
                    <p className="admin-list-sub">{formatDateTime(match.kickoff_at)}</p>
                  </div>
                  <div className="admin-list-right">
                    {match.status === 'live' && <span className="admin-live-pill">LIVE</span>}
                    <span className={`admin-status-pill ${status.className}`}>{status.label}</span>
                    <strong>{scoreLabel(match)}</strong>
                  </div>
                </li>
              )
            })}
          </ul>
        </article>

        <article className="admin-panel">
          <h2>Derniers articles</h2>
          <ul className="admin-list">
            {safePayload.recentArticles.slice(0, 8).map((article) => (
              <li key={article.id} className="admin-list-item">
                <div>
                  <p className="admin-list-main">{article.titre || article.title}</p>
                  <p className="admin-list-sub">{formatDateTime(article.published_at || article.created_at)}</p>
                </div>
                <Newspaper size={16} className="admin-muted-icon" />
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-panel">
          <h2>Derniers événements</h2>
          <ul className="admin-list">
            {safePayload.recentEvents.slice(0, 10).map((event) => {
              const meta = EVENT_META[event.event_type] || EVENT_META.goal
              const Icon = meta.icon
              return (
                <li key={event.id} className="admin-list-item">
                  <div>
                    <p className="admin-list-main">{event.player_name} ({event.team_name})</p>
                    <p className="admin-list-sub">{event.match_label} - {event.minute}'</p>
                  </div>
                  <span className={`admin-event-pill ${meta.className}`}>
                    <Icon size={14} /> {meta.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>
      </section>

      {/* Recharts visual analytics */}
      <section className="admin-panels-grid">
        <article className="admin-panel admin-chart-panel">
          <h2>Évolution des matchs par journée</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safePayload.matchdaySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D45" />
                <XAxis dataKey="matchday" stroke="#A8AEC9" />
                <YAxis allowDecimals={false} stroke="#A8AEC9" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="matches" name="Matchs" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel admin-chart-panel">
          <h2>Top clubs par buts marqués (Top 10)</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safePayload.goalsByClub}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D45" />
                <XAxis dataKey="club" stroke="#A8AEC9" tick={{ fontSize: 11 }} interval={0} angle={-15} height={48} />
                <YAxis allowDecimals={false} stroke="#A8AEC9" />
                <Tooltip />
                <Legend />
                <Bar dataKey="goals" name="Buts" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel admin-chart-panel">
          <h2>Répartition des statuts de matchs</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safePayload.statusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {safePayload.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel admin-chart-panel">
          <h2>Buts domicile vs extérieur</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safePayload.homeAwaySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D45" />
                <XAxis dataKey="club" stroke="#A8AEC9" tick={{ fontSize: 11 }} interval={0} angle={-15} height={48} />
                <YAxis allowDecimals={false} stroke="#A8AEC9" />
                <Tooltip />
                <Legend />
                <Bar dataKey="homeGoals" name="Domicile" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                <Bar dataKey="awayGoals" name="Extérieur" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Bottom sections */}
      <section className="admin-panels-grid admin-panels-grid-three">
        <article className="admin-panel">
          <h2>Top Scorers</h2>
          <ul className="admin-list">
            {safePayload.topScorers.map((scorer, index) => (
              <li key={`${scorer.player_name}-${index}`} className="admin-list-item">
                <div>
                  <p className="admin-list-main">#{index + 1} {scorer.player_name}</p>
                  <p className="admin-list-sub">{scorer.club_name}</p>
                </div>
                <span className="admin-goal-count">{scorer.goals} buts</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-panel">
          <h2>Prochains matchs</h2>
          <ul className="admin-list">
            {safePayload.upcomingMatches.map((match) => (
              <li key={match.id} className="admin-list-item">
                <div>
                  <p className="admin-list-main">{match.home_name} vs {match.away_name}</p>
                  <p className="admin-list-sub">{formatDateTime(match.kickoff_at)}</p>
                </div>
                <span className="admin-status-pill scheduled">Programmé</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-panel">
          <h2>Flux événements</h2>
          <ul className="admin-list">
            {safePayload.recentEvents.slice(0, 8).map((event) => {
              const meta = EVENT_META[event.event_type] || EVENT_META.goal
              const Icon = meta.icon
              return (
                <li key={`feed-${event.id}`} className="admin-list-item">
                  <div>
                    <p className="admin-list-main">{event.player_name}</p>
                    <p className="admin-list-sub">{event.match_label} - {event.minute}'</p>
                  </div>
                  <span className={`admin-event-pill ${meta.className}`}>
                    <Icon size={14} />
                  </span>
                </li>
              )
            })}
          </ul>
        </article>
      </section>

      {/* Interactive standings table */}
      <section className="admin-panel">
        <h2>Classement général (tri interactif)</h2>
        <div className="admin-table-wrap">
          <table className="admin-standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  <button type="button" className="admin-sort-btn" onClick={() => toggleSort('club_name')}>
                    Club <ArrowUpDown size={14} />
                  </button>
                </th>
                <th>
                  <button type="button" className="admin-sort-btn" onClick={() => toggleSort('points')}>
                    Pts <ArrowUpDown size={14} />
                  </button>
                </th>
                <th>
                  <button type="button" className="admin-sort-btn" onClick={() => toggleSort('played')}>
                    J <ArrowUpDown size={14} />
                  </button>
                </th>
                <th>BP</th>
                <th>BC</th>
                <th>
                  <button type="button" className="admin-sort-btn" onClick={() => toggleSort('goal_difference')}>
                    Diff <ArrowUpDown size={14} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((row, index) => (
                <tr key={`${row.club_name}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{row.club_name || row.team_name}</td>
                  <td>{toNumber(row.points)}</td>
                  <td>{toNumber(row.played ?? row.pj)}</td>
                  <td>{toNumber(row.goals_for ?? row.bp)}</td>
                  <td>{toNumber(row.goals_against ?? row.bc)}</td>
                  <td>{toNumber(row.goal_difference ?? row.gd ?? row.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="admin-dashboard-footnote">
        <Activity size={14} /> Tableau de bord mobile-first, filtré par saison, avec données live + fallback démo.
      </footer>
    </div>
  )
}
