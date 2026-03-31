import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const PUBLIC_NAV = [
  { to: '/',              label: 'Accueil',       end: true },
  { to: '/clubs',         label: 'Clubs' },
  { to: '/joueurs',       label: 'Joueurs' },
  { to: '/resultats',     label: 'Résultats' },
  { to: '/classement',    label: 'Classement' },
  { to: '/statistiques',  label: 'Statistiques' },
]

const ADMIN_LINKS = [
  { to: '/admin/dashboard',  label: 'Dashboard' },
  { to: '/admin/teams',      label: 'Équipes' },
  { to: '/admin/players',    label: 'Joueurs' },
  { to: '/admin/matches',    label: 'Matchs' },
  { to: '/admin/standings',  label: 'Classement' },
  { to: '/admin/stats',      label: 'Statistiques' },
  { to: '/admin/articles',   label: 'Articles' },
]

const navBase = {
  boxShadow: '0 2px 0 var(--f1-red)',
  position: 'sticky',
  top: 0,
  zIndex: 500,
}

const innerStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px',
}

function LogoMark({ subtitle = 'Ligue nationale' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      <div style={{
        width: '36px', height: '36px',
        background: 'var(--f1-red)',
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(232,0,45,0.45)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '0.02em' }}>GFS</span>
      </div>
      <div>
        <div style={{
          fontSize: '1.1rem', fontWeight: '900', color: '#fff',
          letterSpacing: '0.04em', lineHeight: 1.1,
          textTransform: 'uppercase',
        }}>
          Gabon<span style={{ color: 'var(--f1-red)' }}>Foot</span>Stats
        </div>
        <div style={{
          fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)',
          fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>{subtitle}</div>
      </div>
    </div>
  )
}

/* ── Public Navbar ────────────────────────────────────────────────────────── */
function PublicNavbar() {
  const [open, setOpen] = useState(false)

  const linkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center',
    padding: '0 0.6rem', height: '64px',
    fontSize: '0.82rem', fontWeight: '700',
    color: isActive ? 'var(--f1-red)' : 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    borderBottom: isActive ? '3px solid var(--f1-red)' : '3px solid transparent',
    transition: 'all 0.2s',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  })

  return (
    <nav style={{ ...navBase, background: 'var(--f1-dark)' }}>
      <div style={innerStyle}>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <LogoMark />
        </NavLink>

        {/* Desktop links */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '0', listStyle: 'none', flex: 1, paddingLeft: '1.5rem' }}
          className="pub-links-desktop">
          {PUBLIC_NAV.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} style={linkStyle}>{label}</NavLink>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NavLink
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', background: 'var(--f1-red)',
              color: '#fff', borderRadius: '6px', fontSize: '0.78rem',
              fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(232,0,45,0.4)',
            }}
          >
            Admin
          </NavLink>
          <button
            className="hamburger-btn"
            style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: '1.5rem', padding: '0.25rem', cursor: 'pointer',
            }}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >{open ? '✕' : '☰'}</button>
        </div>
      </div>

      {open && (
        <div style={{
          background: '#1e1e28', padding: '0.75rem 1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.15rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }} className="mobile-menu">
          {PUBLIC_NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={{ padding: '0.6rem 0', fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu   { display: none !important; }
        }
        @media (max-width: 899px) {
          .pub-links-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

/* ── Admin Navbar ─────────────────────────────────────────────────────────── */
function AdminNavbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const linkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.4rem 0.65rem', borderRadius: '6px',
    fontSize: '0.8rem', fontWeight: '700',
    color: isActive ? 'var(--f1-red)' : 'rgba(255,255,255,0.75)',
    backgroundColor: isActive ? 'rgba(232,0,45,0.12)' : 'transparent',
    textDecoration: 'none',
    borderBottom: isActive ? '2px solid var(--f1-red)' : '2px solid transparent',
    transition: 'all 0.2s',
    textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
  })

  return (
    <nav style={{ ...navBase, background: 'var(--f1-dark-mid)' }}>
      <div style={innerStyle}>
        <NavLink to="/admin/dashboard" style={{ textDecoration: 'none' }}>
          <LogoMark subtitle="Administration" />
        </NavLink>

        <ul style={{
          display: 'flex', alignItems: 'center', gap: '0.1rem',
          listStyle: 'none', flex: 1, justifyContent: 'center', padding: '0 1rem',
        }} className="admin-links-desktop">
          {ADMIN_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} style={linkStyle}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(232,0,45,0.15)', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(232,0,45,0.35)', borderRadius: '6px',
              padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
            }}
            className="logout-btn"
          >
            Déconnexion
          </button>
          <button
            className="hamburger-btn"
            style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: '1.5rem', padding: '0.25rem', cursor: 'pointer',
            }}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >{open ? '✕' : '☰'}</button>
        </div>
      </div>

      {open && (
        <div style={{
          background: '#1a1a24', padding: '0.75rem 1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }} className="mobile-menu">
          {ADMIN_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} style={linkStyle} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              marginTop: '0.5rem', background: 'rgba(232,0,45,0.2)', color: '#fff',
              border: '1px solid rgba(232,0,45,0.4)', borderRadius: '6px',
              padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '700',
              cursor: 'pointer', textAlign: 'left',
            }}
          >Déconnexion</button>
        </div>
      )}

      <style>{`
        @media (min-width: 1025px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu   { display: none !important; }
        }
        @media (max-width: 1024px) {
          .admin-links-desktop { display: none !important; }
          .logout-btn { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

export default function Navbar() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminNavbar /> : <PublicNavbar />
}
