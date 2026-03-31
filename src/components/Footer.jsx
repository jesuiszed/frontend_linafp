import React from 'react'
import { Link } from 'react-router-dom'

const PUBLIC_LINKS = [
  { to: '/clubs', label: 'Clubs' },
  { to: '/joueurs', label: 'Joueurs' },
  { to: '/resultats', label: 'Résultats' },
  { to: '/classement', label: 'Classement' },
  { to: '/statistiques', label: 'Statistiques' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <h3>Gabon<span style={{ color: 'var(--f1-red)' }}>Foot</span>Stats</h3>
          <p>
            Le site officiel de la Ligue Nationale de Football Professionnel du Gabon (LINAFP).
            Suivez toute l'actualité, les résultats, le classement et les statistiques du
            championnat national.
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
            Identifiants admin : <strong style={{ color: 'rgba(255,255,255,0.5)' }}>admin</strong> / <strong style={{ color: 'rgba(255,255,255,0.5)' }}>admin1234</strong>
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-col">
          <h4>Compétition</h4>
          <ul>
            {PUBLIC_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Admin */}
        <div className="footer-col">
          <h4>Administration</h4>
          <ul>
            <li><Link to="/login">Connexion Admin</Link></li>
            <li><Link to="/admin/dashboard">Dashboard</Link></li>
            <li><Link to="/admin/articles">Articles</Link></li>
            <li><Link to="/admin/teams">Équipes</Link></li>
            <li><Link to="/admin/players">Joueurs</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div className="footer-col">
          <h4>Info</h4>
          <ul>
            <li><a href="#">À propos de la LINAFP</a></li>
            <li><a href="#">Règlement</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Presse</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} LINAFP · GabonFootStats. Tous droits réservés.</span>
        <span>Championnat National de Football du Gabon · Saison 2025-2026</span>
      </div>
    </footer>
  )
}
