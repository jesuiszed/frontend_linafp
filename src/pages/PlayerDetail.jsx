import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlayer } from '../services/api.js'

export default function PlayerDetail() {
  const { id } = useParams()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPlayer(id)
      .then((res) => setPlayer(res.data))
      .catch(() => setError('Joueur introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Chargement du joueur...</p></div>
  if (error || !player) return <div className="page-container"><div className="error-box">{error || 'Joueur introuvable.'}</div></div>

  return (
    <div className="page-container">
      <Link to="/joueurs" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>← Retour aux joueurs</Link>

      <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--gray-200)' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{player.nom}</h1>
        <p style={{ color: 'var(--gray-500)' }}>{player.poste || 'Poste non renseigne'}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
          <div><strong>Nationalite</strong><div>{player.nationalite || 'Gabon'}</div></div>
          <div><strong>Age</strong><div>{player.age ?? '-'}</div></div>
          <div><strong>Numero</strong><div>{player.numero ?? '-'}</div></div>
          <div><strong>Buts</strong><div>{player.goals ?? 0}</div></div>
        </div>
      </div>
    </div>
  )
}
