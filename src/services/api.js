import axios from 'axios'

const TOKEN_KEY = 'gfs_admin_token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const FALLBACK_SEASON_ID = Number(import.meta.env.VITE_SEASON_ID || 1)

let cachedSeasonId = null

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const mapClub = (club) => ({
  id: club.id,
  nom: club.name,
  ville: club.city,
  stade: club.stadium,
  logo: club.logo_url,
  ...club,
})

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first_name: '', last_name: '' }
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] }
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') }
}

const mapPlayer = (player) => {
  const nom = `${player.first_name || ''} ${player.last_name || ''}`.trim()
  return {
    id: player.id,
    nom,
    nationalite: player.nationality,
    poste: player.position,
    age: null,
    numero: null,
    goals: 0,
    team_id: null,
    ...player,
  }
}

const mapMatch = (match) => ({
  id: match.id,
  home_team_id: match.club_home_id,
  away_team_id: match.club_away_id,
  home_score: match.home_score_ft,
  away_score: match.away_score_ft,
  date: match.kickoff_at,
  stade: match.stadium,
  status: match.status,
  ...match,
})

const mapStandingRow = (row) => ({
  team_id: row.club_id,
  team_name: row.club_name,
  played: row.played,
  won: row.wins,
  wins: row.wins,
  drawn: row.draws,
  draws: row.draws,
  lost: row.losses,
  losses: row.losses,
  goals_for: row.goals_for,
  goals_against: row.goals_against,
  points: row.points,
  position: row.position,
  ...row,
})

const getResponseItems = (response) => {
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

const getCurrentSeasonId = async () => {
  if (cachedSeasonId) return cachedSeasonId

  try {
    const response = await api.get('/seasons', { params: { page: 1, page_size: 1 } })
    const items = getResponseItems(response)
    if (items.length > 0 && items[0]?.id) {
      cachedSeasonId = items[0].id
      return cachedSeasonId
    }
  } catch {
    // Fall through to configured fallback season.
  }

  cachedSeasonId = FALLBACK_SEASON_ID
  return cachedSeasonId
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const adminLogin = (data) => {
  const body = new URLSearchParams({
    username: data.username,
    password: data.password,
  })
  return api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// ── Articles ───────────────────────────────────────────────────────────────
export const getArticles = async (params = {}) => {
  const response = await api.get('/articles', { params })
  return { data: getResponseItems(response) }
}

export const getArticle = (id) => api.get(`/articles/${id}`)
export const createArticle = (data) => api.post('/articles', data)
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data)
export const deleteArticle = (id) => api.delete(`/articles/${id}`)

// ── Teams ──────────────────────────────────────────────────────────────────
export const getTeams = async () => {
  const response = await api.get('/clubs')
  return { data: getResponseItems(response).map(mapClub) }
}

export const getTeam = async (id) => {
  const response = await api.get(`/clubs/${id}`)
  return { data: mapClub(response.data) }
}

export const createTeam = async (data) => {
  const payload = {
    name: data.nom,
    city: data.ville || null,
    stadium: data.stade || null,
    logo_url: data.logo || null,
  }
  const response = await api.post('/clubs', payload)
  return { data: mapClub(response.data) }
}

export const updateTeam = async (id, data) => {
  const payload = {
    name: data.nom,
    city: data.ville || null,
    stadium: data.stade || null,
    logo_url: data.logo || null,
  }
  const response = await api.patch(`/clubs/${id}`, payload)
  return { data: mapClub(response.data) }
}

export const deleteTeam = (id) => api.delete(`/clubs/${id}`)

// ── Players ────────────────────────────────────────────────────────────────
export const getPlayers = async (params = {}) => {
  const query = {}
  if (params.q) query.q = params.q
  const response = await api.get('/players', { params: query })
  return { data: getResponseItems(response).map(mapPlayer) }
}

export const getPlayer = async (id) => {
  const response = await api.get(`/players/${id}`)
  return { data: mapPlayer(response.data) }
}

export const createPlayer = async (data) => {
  const names = splitName(data.nom)
  const payload = {
    first_name: names.first_name,
    last_name: names.last_name,
    nationality: data.nationalite || null,
    position: data.poste || null,
  }
  const response = await api.post('/players', payload)
  return { data: mapPlayer(response.data) }
}

export const updatePlayer = async (id, data) => {
  const names = splitName(data.nom)
  const payload = {
    first_name: names.first_name,
    last_name: names.last_name,
    nationality: data.nationalite || null,
    position: data.poste || null,
  }
  const response = await api.patch(`/players/${id}`, payload)
  return { data: mapPlayer(response.data) }
}

export const deletePlayer = (id) => api.delete(`/players/${id}`)

// ── Matches ────────────────────────────────────────────────────────────────
export const getMatches = async () => {
  const response = await api.get('/matches')
  return { data: getResponseItems(response).map(mapMatch) }
}

export const getMatch = async (id) => {
  const response = await api.get(`/matches/${id}`)
  return { data: mapMatch(response.data) }
}

export const createMatch = async (data) => {
  const seasonId = await getCurrentSeasonId()
  const payload = {
    season_id: seasonId,
    matchday: Number(data.matchday || 1),
    kickoff_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    stadium: data.stade || null,
    club_home_id: Number(data.home_team_id),
    club_away_id: Number(data.away_team_id),
    status: data.home_score != null && data.away_score != null ? 'finished' : 'scheduled',
  }

  const created = await api.post('/matches', payload)
  const createdMatch = created.data

  if (data.home_score != null && data.home_score !== '' && data.away_score != null && data.away_score !== '') {
    const scoreResponse = await api.post(`/matches/${createdMatch.id}/score`, {
      home_score_ht: 0,
      away_score_ht: 0,
      home_score_ft: Number(data.home_score),
      away_score_ft: Number(data.away_score),
    })
    return { data: mapMatch(scoreResponse.data) }
  }

  return { data: mapMatch(createdMatch) }
}

export const updateMatch = async (id, data) => {
  const payload = {
    kickoff_at: data.date ? new Date(data.date).toISOString() : undefined,
    stadium: data.stade || null,
    club_home_id: Number(data.home_team_id),
    club_away_id: Number(data.away_team_id),
    status: data.home_score != null && data.home_score !== '' && data.away_score != null && data.away_score !== ''
      ? 'finished'
      : 'scheduled',
  }

  const cleanedPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
  const updated = await api.patch(`/matches/${id}`, cleanedPayload)

  if (data.home_score != null && data.home_score !== '' && data.away_score != null && data.away_score !== '') {
    const scoreResponse = await api.post(`/matches/${id}/score`, {
      home_score_ht: 0,
      away_score_ht: 0,
      home_score_ft: Number(data.home_score),
      away_score_ft: Number(data.away_score),
    })
    return { data: mapMatch(scoreResponse.data) }
  }

  return { data: mapMatch(updated.data) }
}

export const deleteMatch = (id) => api.delete(`/matches/${id}`)

// ── Standings ──────────────────────────────────────────────────────────────
export const getStandings = async () => {
  const seasonId = await getCurrentSeasonId()
  const response = await api.get('/standings', { params: { season_id: seasonId } })
  const rows = response.data?.data?.rows || []
  return { data: rows.map(mapStandingRow) }
}

// ── Stats ──────────────────────────────────────────────────────────────────
export const getStats = async () => {
  const seasonId = await getCurrentSeasonId()
  const [scorersResponse, standingsResponse] = await Promise.all([
    api.get('/stats/top-scorers', { params: { season_id: seasonId, limit: 10 } }).catch(() => ({ data: { data: [] } })),
    getStandings().catch(() => ({ data: [] })),
  ])

  const topScorers = scorersResponse.data?.data || []
  const teamsGoals = (standingsResponse.data || []).map((row) => ({
    team_name: row.team_name,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
  }))

  return {
    data: {
      top_scorers: topScorers,
      teams_goals: teamsGoals,
    },
  }
}

export default api
