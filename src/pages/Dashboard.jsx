import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { getStandings } from '../services/api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

const CHART_COLORS = {
  green:  'rgba(0, 154, 68, 0.85)',
  yellow: 'rgba(252, 209, 22, 0.85)',
  blue:   'rgba(0, 49, 137, 0.85)',
  greenBorder:  '#009A44',
  yellowBorder: '#FCD116',
  blueBorder:   '#003189',
}

const chartCardStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
}

const chartTitleStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#374151',
  marginBottom: '1.25rem',
  paddingBottom: '0.75rem',
  borderBottom: '2px solid #009A44',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

export default function Dashboard() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    getStandings()
      .then((res) => setStandings(res.data))
      .catch(() => setError('Impossible de charger les données du classement.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Chargement du tableau de bord…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-box">{error}</div>
      </div>
    )
  }

  const labels = standings.map((s) => s.team_name || s.team?.nom || `Équipe ${s.team}`)

  // Chart 1 – Goals scored per team
  const goalsData = {
    labels,
    datasets: [
      {
        label: 'Buts marqués',
        data: standings.map((s) => s.goals_for ?? s.bp ?? 0),
        backgroundColor: CHART_COLORS.green,
        borderColor: CHART_COLORS.greenBorder,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  // Chart 2 – W/D/L distribution across all teams
  const totalWins   = standings.reduce((acc, s) => acc + (s.won ?? s.wins ?? s.v ?? 0), 0)
  const totalDraws  = standings.reduce((acc, s) => acc + (s.drawn ?? s.draws ?? s.n ?? 0), 0)
  const totalLosses = standings.reduce((acc, s) => acc + (s.lost ?? s.losses ?? s.d ?? 0), 0)

  const wdlData = {
    labels: ['Victoires', 'Nuls', 'Défaites'],
    datasets: [
      {
        data: [totalWins, totalDraws, totalLosses],
        backgroundColor: [
          CHART_COLORS.green,
          CHART_COLORS.yellow,
          CHART_COLORS.blue,
        ],
        borderColor: [
          CHART_COLORS.greenBorder,
          CHART_COLORS.yellowBorder,
          CHART_COLORS.blueBorder,
        ],
        borderWidth: 2,
      },
    ],
  }

  // Chart 3 – Points per team
  const pointsData = {
    labels,
    datasets: [
      {
        label: 'Points',
        data: standings.map((s) => s.points ?? s.pts ?? 0),
        backgroundColor: CHART_COLORS.yellow,
        borderColor: CHART_COLORS.yellowBorder,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  const barOptions = (titleText) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 35 },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { precision: 0, font: { size: 11 } },
      },
    },
  })

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const pct = total ? Math.round((ctx.raw / total) * 100) : 0
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
          },
        },
      },
    },
  }

  // KPI summary cards
  const totalTeams   = standings.length
  const totalMatches = standings.reduce((a, s) => a + (s.played ?? s.pj ?? 0), 0) / 2
  const totalGoals   = standings.reduce((a, s) => a + (s.goals_for ?? s.bp ?? 0), 0)
  const leader       = standings[0]?.team_name || standings[0]?.team?.nom || '–'

  const kpis = [
    { label: 'Équipes',        value: totalTeams },
    { label: 'Matchs joués',   value: Math.round(totalMatches) },
    { label: 'Buts total',     value: totalGoals },
    { label: 'Leader',         value: leader },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          Tableau de bord
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Vue d'ensemble de la saison en cours
        </p>
      </div>

      {/* KPI Cards */}
      {standings.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {kpis.map(({ label, value }) => (
            <div key={label} style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'var(--f1-red-light)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: '900', color: 'var(--f1-red)',
                flexShrink: 0,
                textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>GFS</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', lineHeight: 1.2 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {standings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Aucune donnée de classement disponible.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Ajoutez des équipes et des matchs pour voir les statistiques.</p>
        </div>
      ) : (
        <>
          {/* Charts grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            {/* Bar chart – Goals */}
            <div style={chartCardStyle}>
              <div style={chartTitleStyle}>
                Buts marqués par équipe
              </div>
              <div style={{ height: '260px', position: 'relative' }}>
                <Bar data={goalsData} options={barOptions('Buts marqués par équipe')} />
              </div>
            </div>

            {/* Doughnut chart – W/D/L */}
            <div style={chartCardStyle}>
              <div style={chartTitleStyle}>
                Répartition V / N / D
              </div>
              <div style={{ height: '260px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={wdlData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Points chart – full width */}
          <div style={chartCardStyle}>
            <div style={chartTitleStyle}>
              Points par équipe
            </div>
            <div style={{ height: '280px', position: 'relative' }}>
              <Bar data={pointsData} options={barOptions('Points par équipe')} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
