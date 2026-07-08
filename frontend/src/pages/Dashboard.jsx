import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { getAnalytics } from '../api/urls'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

const CARD_COLORS = {
  blue:    { bg: 'from-blue-500 to-blue-600',    ring: 'ring-blue-400/30',   icon: '🔗' },
  indigo:  { bg: 'from-indigo-500 to-indigo-600', ring: 'ring-indigo-400/30', icon: '📅' },
  amber:   { bg: 'from-amber-400 to-orange-500',  ring: 'ring-amber-400/30',  icon: '📱' },
  emerald: { bg: 'from-emerald-500 to-teal-600',  ring: 'ring-emerald-400/30', icon: '🖥️' },
}

function StatCard({ label, value, sub, color = 'blue', delay = 0 }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])
  const c = CARD_COLORS[color]
  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg
                    ring-2 ${c.ring} transition-all duration-500
                    hover:shadow-xl hover:-translate-y-1 hover:scale-105 cursor-default
                    ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
         style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold tracking-tight">{value}</p>
          <p className="text-sm font-medium opacity-90 mt-1">{label}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        <span className="text-2xl opacity-80">{c.icon}</span>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
      </div>
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
    </div>
  )
}

function ChartCard({ title, children, empty }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700
                        shadow-sm hover:shadow-md transition-shadow duration-300">
      <h2 className="font-semibold mb-5 text-gray-700 dark:text-gray-200 flex items-center gap-2">
        {title}
      </h2>
      {empty
        ? <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="text-4xl mb-2 animate-float inline-block">📊</span>
            <p className="text-sm">No data yet</p>
          </div>
        : children
      }
    </section>
  )
}

export default function Dashboard() {
  const { shortCode } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [isDark, setIsDark]   = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await getAnalytics(shortCode)
      setData(res); setError('')
    } catch (err) {
      setError(err.response?.status === 404 ? 'Short code not found.' : 'Failed to load analytics.')
    } finally { setLoading(false) }
  }, [shortCode])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) return <main className="max-w-4xl mx-auto px-4 py-10"><Skeleton /></main>
  if (error) return (
    <main className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in space-y-4">
      <div className="text-6xl mb-4">😕</div>
      <p className="text-red-500 text-lg font-medium">{error}</p>
      <button onClick={() => navigate('/')}
        className="text-blue-500 hover:text-blue-600 hover:underline text-sm transition-colors">
        ← Back to Home
      </button>
    </main>
  )

  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  const baseOpts = {
    responsive: true,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 16, font: { size: 12 } } } },
  }
  const axisOpts = {
    ...baseOpts,
    scales: {
      x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
    },
  }

  const lineData = {
    labels: data.clicks_per_day.map(d => d.date),
    datasets: [{
      label: 'Clicks',
      data: data.clicks_per_day.map(d => d.count),
      borderColor: '#6366f1',
      backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
      tension: 0.4, fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  }

  const barData = {
    labels: data.top_referrers.map(r => r.referrer || 'Direct'),
    datasets: [{
      label: 'Clicks',
      data: data.top_referrers.map(r => r.count),
      backgroundColor: ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const doughnutData = {
    labels: ['Mobile', 'Desktop'],
    datasets: [{
      data: [data.device_breakdown.mobile, data.device_breakdown.desktop],
      backgroundColor: ['#f59e0b', '#10b981'],
      hoverBackgroundColor: ['#f59e0b', '#10b981'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }

  const total      = data.device_breakdown.mobile + data.device_breakdown.desktop
  const mobilePct  = total ? Math.round(data.device_breakdown.mobile  / total * 100) : 0
  const desktopPct = total ? Math.round(data.device_breakdown.desktop / total * 100) : 0
  const isExpired  = data.expires_at && new Date(data.expires_at) < new Date()

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
                     hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200
                     hover:-translate-x-0.5 transform">
          ← Back
        </button>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800
                          px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Auto-refreshes every 30s
        </span>
      </div>

      {/* ── URL info card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                      p-6 space-y-2 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-up">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600
                           bg-clip-text text-transparent">
            /{shortCode}
          </span>
          {data.expires_at
            ? <span className={`text-xs px-3 py-1.5 rounded-full font-semibold
                ${isExpired
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                {isExpired ? '🔴 Expired' : `🟢 Expires ${new Date(data.expires_at).toLocaleDateString()}`}
              </span>
            : <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30
                               text-blue-600 dark:text-blue-400 font-semibold">
                🔵 Never expires
              </span>
          }
        </div>
        <p className="text-sm text-gray-400 truncate">
          →{' '}
          <a href={data.original_url} target="_blank" rel="noreferrer"
            className="hover:text-blue-500 hover:underline transition-colors">{data.original_url}</a>
        </p>
        <p className="text-xs text-gray-400">Created: {new Date(data.created_at).toLocaleString()}</p>
      </div>

      {/* ── 4 Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Clicks"   value={data.total_clicks}             color="blue"    delay={0}   />
        <StatCard label="Days Active"    value={data.clicks_per_day.length}    color="indigo"  delay={100} />
        <StatCard label="Mobile"         value={`${mobilePct}%`}  sub={`${data.device_breakdown.mobile} clicks`}  color="amber"   delay={200} />
        <StatCard label="Desktop"        value={`${desktopPct}%`} sub={`${data.device_breakdown.desktop} clicks`} color="emerald" delay={300} />
      </div>

      {/* ── Line chart ── */}
      <ChartCard title="📈 Clicks over time (last 30 days)" empty={data.clicks_per_day.length === 0}>
        <Line data={lineData} options={axisOpts} />
      </ChartCard>

      {/* ── Bar chart ── */}
      <ChartCard title="🌐 Top referrers" empty={data.top_referrers.length === 0}>
        <Bar data={barData} options={axisOpts} />
      </ChartCard>

      {/* ── Doughnut + table ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="📱 Device breakdown" empty={total === 0}>
          <div className="max-w-xs mx-auto">
            <Doughnut data={doughnutData} options={baseOpts} />
          </div>
        </ChartCard>

        {data.top_referrers.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700
                              shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="font-semibold mb-5 text-gray-700 dark:text-gray-200">📋 Referrers</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.top_referrers.map((r, i) => (
                  <tr key={i} className="border-b dark:border-gray-700/60 last:border-0
                                         hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      style={{ animationDelay: `${i * 60}ms` }}>
                    <td className="py-2.5 truncate max-w-[180px] text-gray-600 dark:text-gray-300">
                      {r.referrer || <span className="text-gray-400 italic">Direct</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
                                       px-2.5 py-0.5 rounded-full text-xs">
                        {r.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  )
}
