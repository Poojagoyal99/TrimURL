import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Navbar({ useDark, toggleDark, authUser, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [query, setQuery]       = useState('')
  const [scrolled, setScrolled] = useState(false)

  // Derive username and isStaff directly from the prop passed by App.jsx
  const username = authUser?.username || null
  const isStaff  = authUser?.is_staff  || false

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const code = query.trim()
    if (code) { navigate(`/dashboard/${code}`); setQuery('') }
  }

  async function handleLogout() {
    try {
      const refresh = localStorage.getItem('refresh')
      if (refresh) await logout(refresh)
    } catch { /* ignore errors — clear tokens anyway */ }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    onLogout()   // tell App.jsx to clear authUser immediately
    navigate('/login', { replace: true })
  }

  const isHome    = location.pathname === '/'
  const isMyLinks = location.pathname === '/my-links'

  return (
    <nav className={`sticky top-0 z-50 px-6 py-3 flex items-center gap-4 transition-all duration-300
      ${scrolled
        ? 'glass bg-white/80 dark:bg-gray-900/80 shadow-lg border-b border-white/20 dark:border-gray-700/40'
        : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700'
      }`}>

      {/* Logo */}
      <Link to="/"
        className="flex items-center gap-2 text-lg font-extrabold text-blue-600 dark:text-blue-400 shrink-0 group">
        <span className="inline-block transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">✂️</span>
        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">TrimURL</span>
      </Link>

      {/* Nav links — only shown when logged in */}
      {username && (
        <div className="flex items-center gap-1">
          <Link to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isHome
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            Shorten
          </Link>
          <Link to="/my-links"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isMyLinks
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {isStaff ? '👑 All Links' : 'My Links'}
          </Link>
        </div>
      )}

      {/* Search bar */}
      {username && (
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to analytics… (enter code)"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5
                       bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400 transition-all duration-200"
          />
        </form>
      )}

      {/* Spacer when not logged in */}
      {!username && <div className="flex-1" />}

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto shrink-0">

        {/* Dark mode toggle */}
        <button onClick={toggleDark}
          className="w-9 h-9 flex items-center justify-center rounded-full
                     bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900
                     text-gray-600 dark:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Toggle dark mode">
          <span className="transition-transform duration-300"
            style={{ display: 'inline-block', transform: useDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            {useDark ? '☀️' : '🌙'}
          </span>
        </button>

        {/* Logged-in user info + logout */}
        {username ? (
          <div className="flex items-center gap-2">
            {/* Username badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              ${isStaff
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <span>{isStaff ? '👑' : '👤'}</span>
              <span>{username}</span>
              {isStaff && <span className="text-xs opacity-70">(admin)</span>}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-medium
                         text-gray-600 dark:text-gray-400
                         hover:bg-red-50 dark:hover:bg-red-900/30
                         hover:text-red-600 dark:hover:text-red-400
                         transition-all duration-200 active:scale-95">
              Logout
            </button>
          </div>
        ) : (
          /* Not logged in — show login/register links */
          <div className="flex items-center gap-2">
            <Link to="/login"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              Login
            </Link>
            <Link to="/register"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-700 hover:to-violet-700
                         transition-all duration-200 shadow-sm active:scale-95">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
