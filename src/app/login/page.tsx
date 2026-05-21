'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import s from './page.module.css'

type Tab = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const body = tab === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        router.replace('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    setForm(f => ({ ...f, email, password }))
    setTab('login')
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logoRow}>
          <div className={s.logoIcon}>⚡</div>
          <span className={s.logoName}>TaskFlow</span>
        </div>

        <div className={s.tabRow}>
          <button className={`${s.tab} ${tab === 'login' ? s.active : ''}`} onClick={() => { setTab('login'); setError('') }}>
            Sign In
          </button>
          <button className={`${s.tab} ${tab === 'signup' ? s.active : ''}`} onClick={() => { setTab('signup'); setError('') }}>
            Create Account
          </button>
        </div>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="label" htmlFor="name">Full Name</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}>👤</span>
                <input
                  id="name"
                  className={`input ${s.inputWithIcon}`}
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="email">Email Address</label>
            <div className={s.inputWrapper}>
              <span className={s.inputIcon}>✉️</span>
              <input
                id="email"
                className={`input ${s.inputWithIcon}`}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <div className={s.inputWrapper}>
              <span className={s.inputIcon}>🔒</span>
              <input
                id="password"
                className={`input ${s.inputWithIcon}`}
                type="password"
                placeholder={tab === 'login' ? 'Your password' : 'Min 6 characters'}
                value={form.password}
                onChange={set('password')}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div className={s.error}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            id="submit-btn"
            type="submit"
            className={`btn btn-primary ${s.submitBtn}`}
            disabled={loading}
          >
            {loading ? '⏳ Please wait...' : tab === 'login' ? '→ Sign In' : '→ Create Account'}
          </button>
        </form>

        {tab === 'login' && (
          <>
            <div className={s.dividerRow} style={{ marginTop: 24 }}>Demo accounts</div>
            <div className={s.demoBox} style={{ marginTop: 12 }}>
              <div className={s.demoRow}>
                <div>
                  <strong>Admin</strong>
                  <div style={{ fontSize: '0.75rem', marginTop: 2 }}>admin@taskflow.dev</div>
                </div>
                <button
                  className={s.demoFill}
                  onClick={() => fillDemo('admin@taskflow.dev', 'admin123')}
                  type="button"
                >
                  Use →
                </button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
              <div className={s.demoRow}>
                <div>
                  <strong>Member</strong>
                  <div style={{ fontSize: '0.75rem', marginTop: 2 }}>alice@taskflow.dev</div>
                </div>
                <button
                  className={s.demoFill}
                  onClick={() => fillDemo('alice@taskflow.dev', 'member123')}
                  type="button"
                >
                  Use →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
