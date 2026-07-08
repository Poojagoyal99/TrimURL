import { Navigate, useLocation } from 'react-router-dom'

/**
 * PrivateRoute — wraps any route that requires authentication.
 *
 * If the user is not logged in (no access token in localStorage),
 * they are redirected to /login. The original destination is saved
 * in location.state so Login.jsx can redirect back after success.
 *
 * Usage:
 *   <Route path="/my-links" element={<PrivateRoute><MyLinks /></PrivateRoute>} />
 */
export default function PrivateRoute({ children }) {
  const location = useLocation()
  const token    = localStorage.getItem('access')

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
