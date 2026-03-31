import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScoresTicker from './components/ScoresTicker.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

// Public pages
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Classement from './pages/Standings.jsx'
import Resultats from './pages/Resultats.jsx'
import Clubs from './pages/Clubs.jsx'
import Joueurs from './pages/Joueurs.jsx'
import Statistiques from './pages/Statistiques.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import ArticleDetail from './pages/ArticleDetail.jsx'
import PlayerDetail from './pages/PlayerDetail.jsx'
import ClubDetail from './pages/ClubDetail.jsx'

// Admin pages
import Dashboard from './pages/Dashboard.jsx'
import Teams from './pages/Teams.jsx'
import Players from './pages/Players.jsx'
import Matches from './pages/Matches.jsx'
import Stats from './pages/Stats.jsx'
import Articles from './pages/Articles.jsx'

function AppLayout() {
  const { isAdmin } = useAuth()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {!isAdmin && <ScoresTicker />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* ── Public routes ─────────────────────────────────────────── */}
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/classement"    element={<Classement />} />
          <Route path="/resultats"     element={<Resultats />} />
          <Route path="/resultats/:id" element={<MatchDetail />} />
          <Route path="/clubs"         element={<Clubs />} />
          <Route path="/clubs/:id"     element={<ClubDetail />} />
          <Route path="/joueurs"       element={<Joueurs />} />
          <Route path="/joueurs/:id"   element={<PlayerDetail />} />
          <Route path="/actualites/:id" element={<ArticleDetail />} />
          <Route path="/statistiques"  element={<Statistiques />} />

          {/* Legacy public route aliases */}
          <Route path="/standings"     element={<Navigate to="/classement" replace />} />
          <Route path="/matches"       element={<Navigate to="/resultats" replace />} />

          {/* ── Admin routes (protected) ───────────────────────────────── */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/teams"     element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/admin/players"   element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/admin/matches"   element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/admin/standings" element={<ProtectedRoute><Classement /></ProtectedRoute>} />
          <Route path="/admin/stats"     element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/admin/articles"  element={<ProtectedRoute><Articles /></ProtectedRoute>} />

          {/* Legacy redirects */}
          <Route path="/dashboard"     element={<Navigate to="/admin/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
