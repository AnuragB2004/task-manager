'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface User { id: string; name: string; email: string; role: string; createdAt: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setUsers(d.users || [])
      })
      .finally(() => setLoading(false))
  }, [])

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">All registered users in your workspace</p>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {users.length} total users
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚫</div>
            <h3>Access Denied</h3>
            <p>Only administrators can view this page.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map((u, i) => (
              <div key={u.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                animation: 'fadeIn 0.3s ease both', animationDelay: `${i * 0.04}s`
              }}>
                <div className="avatar avatar-lg">{initials(u.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{u.role}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
