import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { adminLogin } from '../services/api.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin/dashboard'

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    try {
      const res = await adminLogin(form)
      login(res.data.access_token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Identifiants incorrects. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '12px',
            background: 'var(--f1-red)', marginBottom: '1rem',
            boxShadow: '0 4px 16px rgba(232,0,45,0.4)',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '0.03em' }}>GFS</span>
          </div>
          <h1>Administration</h1>
          <p>GabonFootStats · LINAFP</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Identifiant</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
          Accès réservé aux administrateurs LINAFP
        </p>
      </div>
    </div>
  )
}
