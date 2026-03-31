import axios from 'axios'

const TOKEN_KEY = 'gfs_admin_token'
const REFRESH_TOKEN_KEY = 'gfs_admin_refresh_token'
export const AUTH_STORAGE_EVENT = 'gfs-auth-changed'
const API_BASE_URL = 'https://linafp-api.vercel.app/api/v1'
const FALLBACK_SEASON_ID = Number(import.meta.env.VITE_SEASON_ID || 1)

let cachedSeasonId = null
let refreshRequest = null

const isBrowser = () => typeof window !== 'undefined'

const notifyAuthChanged = () => {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}

export const getStoredAccessToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export const getStoredRefreshToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setAuthTokens = (accessToken, refreshToken) => {
  if (!isBrowser()) return

  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  else localStorage.removeItem(TOKEN_KEY)

  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)

  notifyAuthChanged()
}

export const clearAuthTokens = () => {
  if (!isBrowser()) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  notifyAuthChanged()
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach token to every request when present
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const shouldSkipRefresh = (url = '') => (
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/bootstrap-admin')
)

const requestTokenRefresh = async () => {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  const response = await api.post('/auth/refresh', {
    refresh_token: refreshToken,
  })

  const nextAccess = response.data?.access_token
  const nextRefresh = response.data?.refresh_token

  if (!nextAccess || !nextRefresh) {
    throw new Error('Invalid refresh response')
  }

  setAuthTokens(nextAccess, nextRefresh)
  return nextAccess
}

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = requestTokenRefresh().finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const original = error?.config

    if (status !== 401 || !original) {
      return Promise.reject(error)
    }

    const requestUrl = String(original.url || '')
    if (shouldSkipRefresh(requestUrl)) {
      clearAuthTokens()
      return Promise.reject(error)
    }

    if (original.__isRetryRequest) {
      clearAuthTokens()
      return Promise.reject(error)
    }

    if (!getStoredRefreshToken()) {
      clearAuthTokens()
      return Promise.reject(error)
    }

    try {
      original.__isRetryRequest = true
      const freshAccessToken = await refreshAccessToken()
      original.headers = original.headers || {}
      original.headers.Authorization = `Bearer ${freshAccessToken}`
      return api(original)
    } catch (refreshError) {
      clearAuthTokens()
      return Promise.reject(refreshError)
    }
  },
)

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

// ── Match Events ─────────────────────────────────────────────────────────
export const getMatchEvents = async (matchId) => {
  const response = await api.get(`/matches/${matchId}/events`)
  return { data: getResponseItems(response) }
}

export const createMatchEvent = (matchId, data) => api.post(`/matches/${matchId}/events`, data)
export const updateMatchEvent = (matchId, eventId, data) => api.patch(`/matches/${matchId}/events/${eventId}`, data)
export const deleteMatchEvent = (matchId, eventId) => api.delete(`/matches/${matchId}/events/${eventId}`)

// ── Competitions ─────────────────────────────────────────────────────────
export const getCompetitions = async (params = {}) => {
  const response = await api.get('/competitions', { params })
  return { data: getResponseItems(response), meta: response.data?.meta || null }
}

export const getCompetition = (id) => api.get(`/competitions/${id}`)
export const createCompetition = (data) => api.post('/competitions', data)
export const updateCompetition = (id, data) => api.patch(`/competitions/${id}`, data)
export const deleteCompetition = (id) => api.delete(`/competitions/${id}`)

// ── Seasons ──────────────────────────────────────────────────────────────
export const getSeasons = async (params = {}) => {
  const response = await api.get('/seasons', { params })
  return { data: getResponseItems(response), meta: response.data?.meta || null }
}

export const getSeason = (id) => api.get(`/seasons/${id}`)
export const createSeason = (data) => api.post('/seasons', data)
export const updateSeason = (id, data) => api.patch(`/seasons/${id}`, data)
export const deleteSeason = (id) => api.delete(`/seasons/${id}`)

// ── Users (Admin) ────────────────────────────────────────────────────────
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params })
  return { data: getResponseItems(response), meta: response.data?.meta || null }
}

export const getUser = (id) => api.get(`/users/${id}`)
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.patch(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// ── Squad Memberships (Admin) ───────────────────────────────────────────
export const getSquadMemberships = async (params = {}) => {
  const response = await api.get('/squad-memberships', { params })
  return { data: getResponseItems(response), meta: response.data?.meta || null }
}

export const getSquadMembership = (id) => api.get(`/squad-memberships/${id}`)
export const createSquadMembership = (data) => api.post('/squad-memberships', data)
export const updateSquadMembership = (id, data) => api.patch(`/squad-memberships/${id}`, data)
export const deleteSquadMembership = (id) => api.delete(`/squad-memberships/${id}`)

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
