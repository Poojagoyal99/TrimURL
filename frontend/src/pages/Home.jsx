import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { shortenUrl, listUrls, deleteUrl } from '../api/urls'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200
        ${copied
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 scale-95'
          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'}`}>
      {copied ? '✅ Copied!' : 'Copy'}
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [originalUrl, setOriginalUrl] = useState('')
  const [customCode, setCustomCode]   = useState('')
  const [expiresAt, setExpiresAt]     = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [links, setLinks]             = useState([])
  const [mounted, setMounted]         = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchLinks = useCallback(async () => {
    try { const { data } = await listUrls(); setLinks(data) } catch (_) {}
  }, [])

  // Initial fetch
  useEffect(() => { fetchLinks() }, [fetchLinks])

  // Auto-refresh every 30 seconds so click counts stay up to date
  useEffect(() => {
    const interval = setInterval(fetchLinks, 30000)
    return () => clearInterval(interval)
  }, [fetchLinks])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setResult(null); setLoading(true)
    try {
      const body = { original_url: originalUrl }
      if (customCode.trim()) body.custom_code = customCode.trim()
      if (expiresAt) {
        // Set expiry to 23:59:59 on the chosen date — expires at end of that day
        body.expires_at = new Date(`${expiresAt}T23:59:59`).toISOString()
      }
      const { data } = await shortenUrl(body)
      setResult(data)
      fetchLinks()
      setOriginalUrl(''); setCustomCode(''); setExpiresAt('')
    } catch (err) {
      const d = err.response?.data
      if (d?.custom_code)    setError(d.custom_code[0])
      else if (d?.original_url) setError(d.original_url[0])
      else setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  async function handleDelete(code) {
    if (!confirm(`Delete /${code}?`)) return
    try {
      await deleteUrl(code)
      setLinks(prev => prev.filter(l => l.short_code !== code))
      if (result?.short_code === code) setResult(null)
    } catch (_) {}
  }

  const shortUrl = result ? `${BASE_URL}/${result.short_code}/` : ''

  return (
    <div className="overflow-hidden">

      {/* ── Hero Section ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700
                      dark:from-blue-900 dark:via-indigo-900 dark:to-violet-950 py-24 px-4 overflow-hidden">

        {/* Floating background orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-5 right-10 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl animate-float-delay pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center text-white">

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 bg-white/15 glass border border-white/25
                          rounded-full px-4 py-1.5 text-sm font-medium mb-6
                          ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
            Free URL Shortener with Analytics
          </div>

          <h1 className={`text-5xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight
                         ${mounted ? 'animate-fade-up stagger-1' : 'opacity-0'}`}>
            Shorten.{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Share.
            </span>{' '}
            Track.
          </h1>

          <p className={`text-blue-200 text-lg mb-10
                        ${mounted ? 'animate-fade-up stagger-2' : 'opacity-0'}`}>
            Paste a long URL and get a short link with full analytics.
          </p>

          {/* ── Form card ── */}
          <form onSubmit={handleSubmit}
            className={`bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left
                       border border-white/20
                       ${mounted ? 'animate-scale-in stagger-3' : 'opacity-0'}`}>

            <div className="relative group">
              <input type="url" required
                placeholder="https://your-very-long-url.com/..."
                value={originalUrl}
                onChange={e => setOriginalUrl(e.target.value)}
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5
                           text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800
                           focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-750
                           transition-all duration-200 text-sm placeholder-gray-400"
              />
              <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input type="text"
                  placeholder="Custom alias (optional)"
                  maxLength={30}
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-12
                             text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800
                             focus:outline-none focus:border-indigo-500 transition-all duration-200 text-sm"
                />
                {customCode && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                    {customCode.length}/30
                  </span>
                )}
              </div>

              {/* Expiry date — date only, optional */}
              <div className="relative">
                <input type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ colorScheme: 'auto' }}
                />
                {/* Visual display — shown on top, click passes through to hidden input */}
                <div className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3
                                bg-gray-50 dark:bg-gray-800 flex items-center justify-between
                                text-sm pointer-events-none">
                  {expiresAt ? (
                    <span className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      📅 {new Date(expiresAt + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-2">
                      📅 Expiry date <span className="text-xs">(optional)</span>
                    </span>
                  )}
                  <span className="text-gray-400">▾</span>
                </div>
                {/* Clear button — on top of everything */}
                {expiresAt && (
                  <button type="button" onClick={() => setExpiresAt('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                               w-5 h-5 flex items-center justify-center rounded-full
                               bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300
                               hover:bg-red-200 hover:text-red-600 transition-all text-xs font-bold">
                    ×
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="animate-slide-down flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/30
                              border border-red-200 dark:border-red-700 rounded-xl px-4 py-2.5 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-500 hover:to-violet-500 disabled:opacity-50
                         text-white font-bold rounded-xl px-6 py-3.5
                         transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30
                         hover:-translate-y-0.5 active:translate-y-0 active:scale-98 text-sm group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Shortening…</>
                  : <><span className="transition-transform group-hover:rotate-12 inline-block">✂️</span> Shorten URL</>
                }
              </span>
            </button>
          </form>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* ── Result card ── */}
        {result && (
          <div className="animate-scale-in bg-white dark:bg-gray-800 rounded-3xl shadow-xl
                          border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-5">
            {/* Gradient top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full" />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <a href={shortUrl} target="_blank" rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 font-bold text-xl hover:underline truncate
                           transition-colors hover:text-blue-500">
                {shortUrl}
              </a>
              <CopyBtn text={shortUrl} />
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl shadow-md">
                <QRCodeSVG value={shortUrl} size={140} />
              </div>
              <p className="text-xs text-gray-400">Scan QR to open</p>
            </div>

            {result.expires_at && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20
                            rounded-xl px-4 py-2 border border-amber-200 dark:border-amber-700">
                ⏳ Expires: {new Date(result.expires_at).toLocaleString()}
              </p>
            )}

            <button onClick={() => navigate(`/dashboard/${result.short_code}`)}
              className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400
                         hover:text-indigo-500 transition-colors hover:gap-3 duration-200">
              View analytics
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        )}

        {/* ── Recent links table ── */}
        {links.length > 0 && (
          <section className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Links</h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                {links.length} links
              </span>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80
                                  text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Short Link</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell font-semibold">Original URL</th>
                    <th className="text-center px-4 py-3 font-semibold">Clicks</th>
                    <th className="text-center px-4 py-3 font-semibold">Expires</th>
                    <th className="text-center px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {links.map((link, i) => {
                    const url     = `${BASE_URL}/${link.short_code}/`
                    const expired = link.expires_at && new Date(link.expires_at) < new Date()
                    return (
                      <tr key={link.short_code}
                        className="bg-white dark:bg-gray-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                                   transition-colors duration-150 group"
                        style={{ animationDelay: `${i * 0.05}s` }}>
                        <td className="px-4 py-3">
                          <a href={url} target="_blank" rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold
                                       flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                            /{link.short_code}
                          </a>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-400 dark:text-gray-500 max-w-xs truncate text-xs">
                          {link.original_url}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800
                                           px-2.5 py-0.5 rounded-full text-xs">
                            {link.click_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {link.expires_at
                            ? <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                                ${expired
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                                {expired ? '🔴 Expired' : new Date(link.expires_at).toLocaleDateString()}
                              </span>
                            : <span className="text-xs text-gray-400">∞ Never</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <CopyBtn text={url} />
                            <button onClick={() => navigate(`/dashboard/${link.short_code}`)}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40
                                         text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900
                                         transition-all duration-150 hover:scale-105 active:scale-95 font-medium">
                              Stats
                            </button>
                            <button onClick={() => handleDelete(link.short_code)}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40
                                         text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900
                                         transition-all duration-150 hover:scale-105 active:scale-95 font-medium">
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {links.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4 animate-float inline-block">🔗</div>
            <p className="text-gray-400 text-sm">No links yet. Shorten your first URL above!</p>
          </div>
        )}
      </main>
    </div>
  )
}
