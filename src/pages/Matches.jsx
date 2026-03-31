import React, { useEffect, useState } from 'react'
import { getMatches, createMatch, updateMatch, deleteMatch, getTeams } from '../services/api.js'

const EMPTY_FORM = {
  home_team_id: '', away_team_id: '', date: '', stade: '', home_score: '', away_score: '',
}

const formatDate = (dateStr) => {
  if (!dateStr) return '–'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const scoreDisplay = (home, away) => {
  if (home == null && away == null) return <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>À venir</span>
  return (
    <span style={{
      background: '#009A44', color: '#fff',
      padding: '0.2rem 0.6rem', borderRadius: '6px',
      fontWeight: '800', fontSize: '0.9rem',
    }}>
      {home} – {away}
    </span>
  )
}

export default function Matches() {
  const [matches, setMatches]     = useState([])
  const [teams, setTeams]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData]   = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchAll = () => {
    setLoading(true)
    setError(null)
    Promise.all([getMatches(), getTeams()])
      .then(([mRes, tRes]) => {
        setMatches(mRes.data)
        setTeams(tRes.data)
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const teamName = (id) =>
    teams.find((t) => t.id === id || t.id === Number(id))?.nom || `Équipe #${id}`

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (match) => {
    setEditingId(match.id)
    const dateVal = match.date ? match.date.substring(0, 10) : ''
    setFormData({
      home_team_id: match.home_team_id != null ? String(match.home_team_id) : String(match.home_team ?? ''),
      away_team_id: match.away_team_id != null ? String(match.away_team_id) : String(match.away_team ?? ''),
      date:         dateVal,
      stade:        match.stade || '',
      home_score:   match.home_score != null ? String(match.home_score) : '',
      away_score:   match.away_score != null ? String(match.away_score) : '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => { if (!saving) setModalOpen(false) }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.home_team_id) { setFormError('Sélectionnez l\'équipe domicile.'); return }
    if (!formData.away_team_id) { setFormError('Sélectionnez l\'équipe extérieure.'); return }
    if (formData.home_team_id === formData.away_team_id) {
      setFormError('Les deux équipes doivent être différentes.')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = {
      home_team_id: Number(formData.home_team_id),
      away_team_id: Number(formData.away_team_id),
      date:         formData.date || null,
      stade:        formData.stade || '',
      home_score:   formData.home_score !== '' ? Number(formData.home_score) : null,
      away_score:   formData.away_score !== '' ? Number(formData.away_score) : null,
    }
    try {
      if (editingId) {
        await updateMatch(editingId, payload)
      } else {
        await createMatch(payload)
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (match) => {
    const label = `${teamName(match.home_team_id ?? match.home_team)} vs ${teamName(match.away_team_id ?? match.away_team)}`
    if (!window.confirm(`Supprimer le match « ${label} » ?`)) return
    try {
      await deleteMatch(match.id)
      fetchAll()
    } catch {
      alert('Impossible de supprimer ce match.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><span>Matchs</span></h1>
        <button className="btn-primary" onClick={openCreate}>+ Créer un match</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement des matchs…</p>
        </div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontWeight: '600' }}>Aucun match enregistré.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Cliquez sur « Créer un match » pour commencer.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Domicile</th>
                <th style={{ textAlign: 'center' }}>Score</th>
                <th>Extérieur</th>
                <th>Date</th>
                <th>Stade</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, idx) => {
                const homeId = match.home_team_id ?? match.home_team
                const awayId = match.away_team_id ?? match.away_team
                return (
                  <tr key={match.id}>
                    <td style={{ color: '#6b7280', fontWeight: '600', width: '48px' }}>{idx + 1}</td>
                    <td style={{ fontWeight: '700' }}>{teamName(homeId)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {scoreDisplay(match.home_score, match.away_score)}
                    </td>
                    <td style={{ fontWeight: '700' }}>{teamName(awayId)}</td>
                    <td>{formatDate(match.date)}</td>
                    <td>{match.stade || '–'}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-edit" onClick={() => openEdit(match)}>Modifier</button>
                        <button className="btn-danger" onClick={() => handleDelete(match)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingId ? 'Modifier le match' : 'Nouveau match'}
            </h2>

            {formError && <div className="error-box">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="m-home">Équipe domicile <span style={{ color: '#dc2626' }}>*</span></label>
                  <select id="m-home" name="home_team_id" value={formData.home_team_id} onChange={handleChange} required>
                    <option value="">– Sélectionner –</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="m-away">Équipe extérieure <span style={{ color: '#dc2626' }}>*</span></label>
                  <select id="m-away" name="away_team_id" value={formData.away_team_id} onChange={handleChange} required>
                    <option value="">– Sélectionner –</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="m-home-score">Score domicile</label>
                  <input
                    id="m-home-score"
                    name="home_score"
                    type="number"
                    min="0"
                    value={formData.home_score}
                    onChange={handleChange}
                    placeholder="–"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="m-away-score">Score extérieur</label>
                  <input
                    id="m-away-score"
                    name="away_score"
                    type="number"
                    min="0"
                    value={formData.away_score}
                    onChange={handleChange}
                    placeholder="–"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="m-date">Date</label>
                  <input
                    id="m-date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="m-stade">Stade</label>
                  <input
                    id="m-stade"
                    name="stade"
                    value={formData.stade}
                    onChange={handleChange}
                    placeholder="ex. Stade de l'Amitié"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
