import api from './client'

// Register a new account
// Returns: { detail } — no tokens yet, user must verify email first
export const register = (data) => api.post('/api/auth/register/', data)

// Verify the OTP sent to email after registration
// Body: { email, otp }
// Returns: { detail, user, access, refresh }
export const verifyOtp = (data) => api.post('/api/auth/verify-otp/', data)

// Resend OTP to the given email (rate-limited to once per 60 seconds)
// Body: { email }
// Returns: { detail }
export const resendOtp = (data) => api.post('/api/auth/resend-otp/', data)

// Login with username + password
// Returns: { access, refresh }
export const login = (data) => api.post('/api/auth/login/', data)

// Refresh the access token
// Returns: { access }
export const refreshToken = (refresh) => api.post('/api/auth/token/refresh/', { refresh })

// Get current user's profile
// Returns: { id, username, email, is_staff, date_joined }
export const getMe = () => api.get('/api/auth/me/')

// Logout — blacklists the refresh token on the server
export const logout = (refresh) => api.post('/api/auth/logout/', { refresh })
