import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import StarCanvas from '../components/StarCanvas'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', name: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form.email, form.name, form.password, form.password2)
    } catch (err) {
      if (!err.response) {
        setErrors({ _general: 'Cannot connect to the server. Make sure the backend is running on port 8000.' })
        return
      }
      const data = err.response?.data || {}
      const mapped = {}
      Object.entries(data).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : v
      })
      if (data.detail) mapped._general = data.detail
      if (data.non_field_errors) mapped._general = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors
      if (!Object.keys(mapped).length) mapped._general = 'Something went wrong. Please try again.'
      setErrors(mapped)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <StarCanvas />
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="sb-glyph auth-glyph">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <p className="auth-brand-name">GradeOS</p>
            <p className="sb-sub">Track · Analyze · Improve</p>
          </div>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start tracking your CGPA across devices</p>
        </div>

        {errors._general && <div className="auth-error">{errors._general}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              id="reg-name"
              className={`auth-input ${errors.name ? 'err' : ''}`}
              type="text"
              placeholder="e.g. Asif Rahman"
              value={form.name}
              onChange={set('name')}
              required
              autoComplete="name"
            />
            {errors.name && <span className="auth-field-err">{errors.name}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <input
              id="reg-email"
              className={`auth-input ${errors.email ? 'err' : ''}`}
              type="email"
              placeholder="e.g. asif@gmail.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
            {errors.email && <span className="auth-field-err">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              id="reg-password"
              className={`auth-input ${errors.password ? 'err' : ''}`}
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
            />
            {errors.password && <span className="auth-field-err">{errors.password}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              id="reg-password2"
              className={`auth-input ${errors.password2 ? 'err' : ''}`}
              type="password"
              placeholder="Re-enter your password"
              value={form.password2}
              onChange={set('password2')}
              required
              autoComplete="new-password"
            />
            {errors.password2 && <span className="auth-field-err">{errors.password2}</span>}
          </div>

          <button id="reg-submit" className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
