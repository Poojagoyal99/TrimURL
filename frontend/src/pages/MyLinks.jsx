import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUrls, deleteUrl } from '../api/urls'

const BASE_URL = 'http://127.0.0.1:8000'

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

export default function MyLinks() {
  const navigate = useNavigate()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Decode JWT to check if current user is admin
  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setIsAdmin(payload.is_staff || false)
      } catch { setIsAdmin(false) }
    }
  }, [])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listUrls()
      setLinks(data)
    } catch (_) {
      setLinks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  async function handleDelete(code) {
    if (!confirm(`Delete /${code}?`)) return
    try {
      await deleteUrl(code)
      setLinks(prev => prev.filter(l => l.short_code !== code))
    } catch (_) {
      // silent
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading your links…</div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAdmin ? '👑 All Links' : 'My Links'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? 'All shortened links across every user.' : 'Manage your shortened links and view analytics.'}
          </p>
        </div>
        <button onClick={() => navigate('/')}
          className="inline-flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-900
                         px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200
                         dark:hover:bg-gray-800 transition-colors duration-200">
          Create new link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                         p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No links yet</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Shorten your first URL from the home page to see it here.</p>
          <button onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg
                           hover:bg-blue-500 transition-colors duration-200">
            Go to Home
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Short Link</th>
                <th className="px-4 py-3 hidden md:table-cell">Original URL</th>
                {isAdmin && <th className="px-4 py-3 text-center">Owner</th>}
                <th className="px-4 py-3 text-center">Clicks</th>
                <th className="px-4 py-3 text-center">Expires</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {links.map((link) => {
                const url = `${BASE_URL}/${link.short_code}/`
                const expired = link.expires_at && new Date(link.expires_at) < new Date()
                return (
                  <tr key={link.short_code} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-150">
                    <td className="px-4 py-4">
                      <a href={url} target="_blank" rel="noreferrer"
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[12rem]">
                        /{link.short_code}
                      </a>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-gray-500 dark:text-gray-400 truncate max-w-[28rem]">
                      {link.original_url}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${link.owner
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                          {link.owner ? `👤 ${link.owner}` : '— guest —'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-center text-gray-700 dark:text-gray-200">
                      {link.click_count}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {link.expires_at ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
                          ${expired ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                          {expired ? 'Expired' : new Date(link.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center space-y-2 sm:space-y-0 sm:flex sm:justify-center sm:gap-2">
                      <CopyBtn text={url} />
                      <button onClick={() => navigate(`/dashboard/${link.short_code}`)}
                        className="rounded-2xl bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-150">
                        Stats
                      </button>
                      <button onClick={() => handleDelete(link.short_code)}
                        className="rounded-2xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-150">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
