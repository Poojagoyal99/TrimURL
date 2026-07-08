import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar       from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Home         from './pages/Home'
import Dashboard    from './pages/Dashboard'
import Login        from './pages/Login'
import Register     from './pages/Register'
import MyLinks      from './pages/MyLinks'
import NotFound     from './pages/NotFound'

// Decode JWT and return { username, is_staff } or null
function decodeToken(token) {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  // Central auth state — single source of truth for the whole app
  const [authUser, setAuthUser] = useState(() => decodeToken(localStorage.getItem('access')))

  // Call this after login / OTP verify to instantly update Navbar
  const onLogin = useCallback(() => {
    setAuthUser(decodeToken(localStorage.getItem('access')))
  }, [])

  // Call this after logout to instantly clear Navbar
  const onLogout = useCallback(() => {
    setAuthUser(null)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar
          useDark={dark}
          toggleDark={() => setDark(!dark)}
          authUser={authUser}
          onLogout={onLogout}
        />
        <Routes>
          {/* Only login and register are public */}
          <Route path="/login"    element={<Login    onLogin={onLogin} />} />
          <Route path="/register" element={<Register onLogin={onLogin} />} />

          {/* Everything else requires login */}
          <Route path="/" element={
            <PrivateRoute><Home /></PrivateRoute>
          } />
          <Route path="/my-links" element={
            <PrivateRoute><MyLinks /></PrivateRoute>
          } />
          <Route path="/dashboard/:shortCode" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
