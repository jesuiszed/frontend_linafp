import React, { useEffect, useState, useCallback } from 'react'
import { getPlayers, createPlayer, updatePlayer, deletePlayer, getTeams } from '../services/api.js'

const POSTES = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']

const EMPTY_FORM = {
  nom: '', age: '', nationalite: '', poste: '', numero: '', goals: '', team_id: '',
}

export default function Players() {
  const [players, setPlayers]     = useState([])
  const [teams, setTeams]         = useState([])
  const [filterTeam, setFilterTeam] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData]   = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    getTeams().then((res) => setTeams(res.data)).catch(() => {})
  }, [])

  const fetchPlayers = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = filterTeam ? { team_id: filterTeam } : {}
    getPlayers(params)
      .then((res) => setPlayers(res.data))
      .catch(() => setError('Impossible de charger les joueurs.'))
      .finally(() => setLoading(false))
  }, [filterTeam])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  const teamName = (id) => teams.find((t) => t.id === id || t.id === Number(id))?.nom || '–'

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (player) => {
    setEditingId(player.id)
    setFormData({
      nom:         player.nom || '',
      age:         player.age != null ? String(player.age) : '',
      nationalite: player.nationalite || '',
      poste:       player.poste || '',
      numero:      player.numero != null ? String(player.numero) : '',
      goals:       player.goals != null ? String(player.goals) : '',
      team_id:     player.team_id != null ? String(player.team_id) : (player.team != null ? String(player.team) : ''),
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
    if (!formData.nom.trim()) { setFormError('Le nom du joueur est requis.'); return }
    if (!formData.team_id) { setFormError('Veuillez sélectionner une équipe.'); return }
    setSaving(true)
    setFormError(null)
    const payload = {
      nom:         formData.nom,
      nationalite: formData.nationalite,
      poste:       formData.poste,
      age:         formData.age !== '' ? Number(formData.age) : null,
      numero:      formData.numero !== '' ? Number(formData.numero) : null,
      goals:       formData.goals !== '' ? Number(formData.goals) : 0,
      team_id:     Number(formData.team_id),
    }
    try {
      if (editingId) {
        await updatePlayer(editingId, payload)
      } else {
        await createPlayer(payload)
      }
      setModalOpen(false)
      fetchPlayers()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (player) => {
    if (!window.confirm(`Supprimer le joueur « ${player.nom} » ?`)) return
    try {
      await deletePlayer(player.id)
      fetchPlayers()
    } catch {
      alert('Impossible de supprimer ce joueur.')
    }
  }

  const posteBadgeColor = (poste) => {
    const map = { Gardien: 'badge-blue', Défenseur: 'badge-green', Milieu: 'badge-yellow', Attaquant: 'badge-green' }
    return map[poste] || 'badge-blue'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><span>Joueurs</span></h1>
        <button className="btn-primary" onClick={openCreate}>+ Ajouter un joueur</button>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <label htmlFor="filter-team">Filtrer par équipe :</label>
        <select
          id="filter-team"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          style={{ maxWidth: '260px' }}
        >
          <option value="">Toutes les équipes</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement des joueurs…</p>
        </div>
      ) : players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontWeight: '600' }}>Aucun joueur trouvé.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {filterTeam ? 'Aucun joueur dans cette équipe.' : 'Cliquez sur « Ajouter un joueur » pour commencer.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Âge</th>
                <th>Nationalité</th>
                <th>Poste</th>
                <th style={{ textAlign: 'center' }}>N°</th>
                <th>Équipe</th>
                <th style={{ textAlign: 'center' }}>Buts</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, idx) => (
                <tr key={player.id}>
                  <td style={{ color: '#6b7280', fontWeight: '600', width: '48px' }}>{idx + 1}</td>
                  <td style={{ fontWeight: '700', color: '#111827' }}>{player.nom}</td>
                  <td>{player.age ?? '–'}</td>
                  <td>{player.nationalite || '–'}</td>
                  <td>
                    {player.poste
                      ? <span className={`badge ${posteBadgeColor(player.poste)}`}>{player.poste}</span>
                      : '–'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{player.numero ?? '–'}</td>
                  <td>
                    <span className="badge badge-green">
                      {teamName(player.team_id ?? player.team)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#009A44' }}>
                    {player.goals ?? 0}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => openEdit(player)}>Modifier</button>
                      <button className="btn-danger" onClick={() => handleDelete(player)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingId ? 'Modifier le joueur' : 'Nouveau joueur'}
            </h2>

            {formError && <div className="error-box">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="p-nom">Nom complet <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    id="p-nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="ex. Pierre Aubameyang"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-age">Âge</label>
                  <input
                    id="p-age"
                    name="age"
                    type="number"
                    min="14"
                    max="50"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="ex. 24"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-nationalite">Nationalité</label>
                  <input
                    id="p-nationalite"
                    name="nationalite"
                    value={formData.nationalite}
                    onChange={handleChange}
                    placeholder="ex. Gabonaise"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-poste">Poste</label>
                  <select id="p-poste" name="poste" value={formData.poste} onChange={handleChange}>
                    <option value="">– Sélectionner –</option>
                    {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="p-numero">Numéro</label>
                  <input
                    id="p-numero"
                    name="numero"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="ex. 9"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-goals">Buts marqués</label>
                  <input
                    id="p-goals"
                    name="goals"
                    type="number"
                    min="0"
                    value={formData.goals}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-team">Équipe <span style={{ color: '#dc2626' }}>*</span></label>
                  <select id="p-team" name="team_id" value={formData.team_id} onChange={handleChange} required>
                    <option value="">– Sélectionner –</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
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
