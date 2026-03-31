import React, { useEffect, useState } from 'react'
import { getArticles, createArticle, updateArticle, deleteArticle } from '../services/api.js'

const CATS = ['news', 'match', 'transfert']
const CAT_LABELS = { news: 'Actualité', match: 'Match', transfert: 'Transfert' }

const EMPTY = { titre: '', contenu: '', image_url: '', categorie: 'news', auteur: 'Rédaction LINAFP', publie: true }

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    // Admin sees all – use a backdoor: fetch without publie filter by adding admin token
    getArticles()
      .then((r) => setArticles(r.data))
      .catch(() => setError('Impossible de charger les articles.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (a) => {
    setEditing(a.id)
    setForm({ titre: a.titre, contenu: a.contenu, image_url: a.image_url || '', categorie: a.categorie, auteur: a.auteur, publie: a.publie })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setError('') }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titre.trim() || !form.contenu.trim()) {
      setError('Titre et contenu sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, image_url: form.image_url || null }
      if (editing) {
        await updateArticle(editing, payload)
      } else {
        await createArticle(payload)
      }
      closeModal()
      load()
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet article ?')) return
    try {
      await deleteArticle(id)
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError('Impossible de supprimer cet article.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><span>Articles</span></h1>
        <button className="btn-primary" onClick={openCreate}>+ Nouvel article</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Chargement…</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Auteur</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Publié</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  Aucun article.
                </td></tr>
              ) : articles.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: '600', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</td>
                  <td>
                    <span className={`badge badge-${a.categorie === 'news' ? 'green' : a.categorie === 'match' ? 'blue' : 'yellow'}`}>
                      {CAT_LABELS[a.categorie] || a.categorie}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{a.auteur}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{formatDate(a.date_publication)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {a.publie
                      ? <span style={{ color: 'var(--f1-red)', fontWeight: '700' }}>✓</span>
                      : <span style={{ color: 'var(--gray-300)' }}>–</span>}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openEdit(a)}>Modifier</button>
                      <button className="btn-danger" onClick={() => handleDelete(a.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-title">{editing ? 'Modifier l\'article' : 'Nouvel article'}</div>
            {error && <div className="error-box">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre *</label>
                <input name="titre" value={form.titre} onChange={handleChange} placeholder="Titre de l'article" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie</label>
                  <select name="categorie" value={form.categorie} onChange={handleChange}>
                    {CATS.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Auteur</label>
                  <input name="auteur" value={form.auteur} onChange={handleChange} placeholder="Auteur" />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." type="url" />
              </div>
              <div className="form-group">
                <label>Contenu *</label>
                <textarea
                  name="contenu" value={form.contenu} onChange={handleChange}
                  placeholder="Contenu de l'article…"
                  rows={6} required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="publie" name="publie" type="checkbox"
                  checked={form.publie} onChange={handleChange}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="publie" style={{ margin: 0, textTransform: 'none', letterSpacing: 0 }}>
                  Publier immédiatement
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : (editing ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
