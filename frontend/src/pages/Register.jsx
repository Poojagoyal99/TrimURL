import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, verifyOtp, resendOtp } from '../api/auth'

// ─── OTP Input — 6 individual digit boxes ────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputsRef = useRef([])

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus()
    }
  }

  function handleInput(e, index) {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const newVal = value.split('')
    newVal[index] = digit
    const joined = newVal.join('')
    onChange(joined)
    if (digit && index < 5) {
      inputsRef.current[index + 1].focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted)
      inputsRef.current[5].focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2
                     border-gray-300 dark:border-gray-600
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     transition-all duration-200"
        />
      ))}
    </div>
  )
}

// ─── Main Register Component ─────────────────────────────────────────────────
export default function Register({ onLogin }) {
  const navigate = useNavigate()

  // 'register' → show registration form
  // 'verify'   → show OTP verification screen
  const [step, setStep]         = useState('register')
  const [email, setEmail]       = useState('')         // stored to pass to OTP step

  // Register form state
  const [form, setForm]         = useState({ username: '', email: '', password: '', password2: '' })
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)

  // OTP step state
  const [otp, setOtp]           = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)  // seconds remaining
  const [successMsg, setSuccessMsg] = useState('')

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // ── Registration submit ──────────────────────────────────────────────────
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      // Registration successful — move to OTP step
      setEmail(form.email)
      setResendCooldown(60)
      setStep('verify')
    } catch (err) {
      const data = err.response?.data || {}
      setErrors(data)
    } finally {
      setLoading(false)
    }
  }

  // ── OTP verification submit ──────────────────────────────────────────────
  async function handleVerifySubmit(e) {
    e.preventDefault()
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits.')
      return
    }
    setOtpError('')
    setOtpLoading(true)
    try {
      const { data } = await verifyOtp({ email, otp })
      // Store tokens — user is now logged in
      localStorage.setItem('access',  data.access)
      localStorage.setItem('refresh', data.refresh)
      onLogin()   // tell App.jsx to update Navbar immediately
      navigate('/my-links', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed. Please try again.'
      setOtpError(msg)
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0) return
    setOtpError('')
    setSuccessMsg('')
    try {
      await resendOtp({ email })
      setResendCooldown(60)
      setOtp('')
      setSuccessMsg('A new OTP has been sent to your email.')
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not resend OTP. Try again.'
      setOtpError(msg)
    }
  }

  // ── Field error helper ───────────────────────────────────────────────────
  function fieldError(field) {
    const e = errors[field]
    if (!e) return null
    const msg = Array.isArray(e) ? e[0] : e
    return <p className="mt-1 text-xs text-red-500">{msg}</p>
  }

  // ────────────────────────────────────────────────────────────────────────
  //  OTP Verification Screen
  // ────────────────────────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-4xl">📧</span>
              <h1 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">Check your email</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We sent a 6-digit verification code to
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">{email}</p>
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700
                              text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                <span>✅</span> {successMsg}
              </div>
            )}

            {/* Error */}
            {otpError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700
                              text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span> {otpError}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              {/* OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter verification code
                </label>
                <OtpInput value={otp} onChange={(val) => { setOtp(val); setOtpError('') }} />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full py-2.5 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-blue-600 to-violet-600
                           hover:from-blue-700 hover:to-violet-700
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
                {otpLoading ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            {/* Resend */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Didn't receive it?{' '}
              {resendCooldown > 0 ? (
                <span className="text-gray-400 dark:text-gray-500">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Resend OTP
                </button>
              )}
            </div>

            {/* Back to register */}
            <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
              Wrong email?{' '}
              <button
                onClick={() => { setStep('register'); setOtp(''); setOtpError('') }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Registration Form Screen
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl">✂️</span>
            <h1 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">Create account</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start shortening and tracking your links</p>
          </div>

          {/* Non-field errors */}
          {errors.non_field_errors && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700
                            text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <span>⚠️</span> {errors.non_field_errors[0]}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
                placeholder="choose_a_username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
              {fieldError('username')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
              {fieldError('email')}
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
                placeholder="at least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
              {fieldError('password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                required
                placeholder="repeat your password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 placeholder-gray-400"
              />
              {fieldError('password2')}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-blue-600 to-violet-600
                         hover:from-blue-700 hover:to-violet-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
