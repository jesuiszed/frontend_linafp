import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getArticle } from '../services/api.js'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const CAT = {
  news: 'Actualite',
  match: 'Match',
  transfert: 'Transfert',
  national_team: 'Selection nationale',
}

export default function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getArticle(id)
      .then((res) => setArticle(res.data))
      .catch(() => setError('Actualite introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Chargement de l'actualite...</p></div>
  if (error || !article) return <div className="page-container"><div className="error-box">{error || 'Actualite introuvable.'}</div></div>

  return (
    <div className="page-container" style={{ maxWidth: '960px', width: '100%' }}>
      <Link to="/" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>← Retour a l'accueil</Link>

      <article style={{ marginTop: '1rem', background: '#fff', borderRadius: '14px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        {article.image_url && (
          <img src={article.image_url} alt={article.titre} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
        )}

        <div style={{ padding: '1.4rem 1.5rem 1.8rem' }}>
          <span className="badge badge-blue">{CAT[article.categorie] || article.categorie}</span>
          <h1 style={{ marginTop: '0.75rem' }}>{article.titre}</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            {article.auteur} · {formatDate(article.date_publication)}
          </p>
          <p style={{ lineHeight: 1.8, marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{article.contenu}</p>
        </div>
      </article>
    </div>
  )
}
