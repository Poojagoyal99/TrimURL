import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname || '/'

  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('')  // fade out error as soon as user starts correcting
  }

  // Quick-fill the admin credentials with one click
  function fillAdmin() {
    setForm({ username: 'admin', password: 'admin123' })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form)
      localStorage.setItem('access',  data.access)
      localStorage.setItem('refresh', data.refresh)
      onLogin()   // tell App.jsx to update Navbar immediately

      // Decode JWT payload to check if user is admin (is_staff)
      // JWT payload is the middle part (base64 encoded)
      const payload = JSON.parse(atob(data.access.split('.')[1]))
      const isStaff = payload.is_staff

      // Admin → goes to /my-links (shows ALL links)
      // Regular user → goes to where they came from, or home
      navigate(isStaff ? '/my-links' : from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid username or password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl">✂️</span>
            <h1 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to manage your links</p>
          </div>

          {/* Quick-fill hint for admin */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">👑 Admin access</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">username: <b>admin</b> · password: <b>admin123</b></p>
            </div>
            <button
              type="button"
              onClick={fillAdmin}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold
                         hover:bg-blue-700 transition-all duration-200 active:scale-95 shrink-0">
              Fill
            </button>
          </div>

          {/* Error banner — always rendered, fades in/out smoothly */}
          <div className={`mb-4 px-4 py-3 rounded-lg border text-sm flex items-center gap-2
                           transition-all duration-300 ease-in-out
                           ${error
                             ? 'opacity-100 translate-y-0 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'
                             : 'opacity-0 pointer-events-none border-transparent bg-transparent select-none'
                           }`}>
            <span>⚠️</span>
            <span>{error || ' '}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
                placeholder="your_username or you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-700 hover:to-violet-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
