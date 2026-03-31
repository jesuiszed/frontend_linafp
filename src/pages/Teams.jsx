import React, { useEffect, useState } from 'react'
import { getTeams, createTeam, updateTeam, deleteTeam } from '../services/api.js'

const EMPTY_FORM = { nom: '', ville: '', stade: '', logo: '' }

export default function Teams() {
  const [teams, setTeams]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchTeams = () => {
    setLoading(true)
    setError(null)
    getTeams()
      .then((res) => setTeams(res.data))
      .catch(() => setError('Impossible de charger les équipes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeams() }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (team) => {
    setEditingId(team.id)
    setFormData({ nom: team.nom || '', ville: team.ville || '', stade: team.stade || '', logo: team.logo || '' })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nom.trim()) { setFormError('Le nom de l\'équipe est requis.'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        await updateTeam(editingId, formData)
      } else {
        await createTeam(formData)
      }
      setModalOpen(false)
      fetchTeams()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (team) => {
    if (!window.confirm(`Supprimer l'équipe « ${team.nom} » ? Cette action est irréversible.`)) return
    try {
      await deleteTeam(team.id)
      fetchTeams()
    } catch {
      alert('Impossible de supprimer cette équipe.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><span>Équipes</span></h1>
        <button className="btn-primary" onClick={openCreate}>+ Ajouter une équipe</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement des équipes…</p>
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontWeight: '600' }}>Aucune équipe enregistrée.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Cliquez sur « Ajouter une équipe » pour commencer.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Ville</th>
                <th>Stade</th>
                <th>Logo</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.id}>
                  <td style={{ color: '#6b7280', fontWeight: '600', width: '48px' }}>{idx + 1}</td>
                  <td style={{ fontWeight: '700', color: '#111827' }}>{team.nom}</td>
                  <td>{team.ville || '–'}</td>
                  <td>{team.stade || '–'}</td>
                  <td>
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.nom}
                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : <span style={{ color: '#d1d5db' }}>–</span>}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => openEdit(team)}>Modifier</button>
                      <button className="btn-danger" onClick={() => handleDelete(team)}>Supprimer</button>
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
              {editingId ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
            </h2>

            {formError && <div className="error-box">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nom">Nom de l'équipe <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="ex. Mangasport"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ville">Ville</label>
                  <input
                    id="ville"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder="ex. Libreville"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stade">Stade</label>
                  <input
                    id="stade"
                    name="stade"
                    value={formData.stade}
                    onChange={handleChange}
                    placeholder="ex. Stade Omar Bongo"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="logo">URL du logo</label>
                <input
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="https://…"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                  Annuler
                </button>
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
