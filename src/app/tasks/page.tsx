'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Task {
  id: string; title: string; description: string | null
  status: string; priority: string; dueDate: string | null
  project: { id: string; name: string }
  assignee: { id: string; name: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  TODO: 'badge-todo', IN_PROGRESS: 'badge-progress', REVIEW: 'badge-review', DONE: 'badge-done'
}
const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent'
}
const STATUS_FILTER = ['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']

function fmt(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [me, setMe] = useState<{ id: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user))
  }, [])

  useEffect(() => {
    if (!me) return
    // Fetch tasks from dashboard endpoint (contains myTasks)
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        // For admin get recentTasks (all), for member get myTasks
        if (me.role === 'ADMIN') {
          setTasks(d.recentTasks || [])
        } else {
          setTasks(d.myTasks || [])
        }
      })
      .finally(() => setLoading(false))
  }, [me])

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Tasks</h1>
            <p className="page-subtitle">Tasks assigned to you across all projects</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {STATUS_FILTER.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f === 'ALL' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No tasks found</h3>
            <p>{filter === 'ALL' ? 'No tasks assigned to you yet.' : `No tasks with status "${filter.replace('_', ' ')}".`}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((t, i) => (
              <Link key={t.id} href={`/projects/${t.project.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  animationDelay: `${i * 0.04}s`, animation: 'fadeIn 0.3s ease both',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: 4, height: 40, borderRadius: 4, flexShrink: 0,
                    background: t.status === 'DONE' ? '#10b981' : t.status === 'IN_PROGRESS' ? '#6366f1' :
                      t.status === 'REVIEW' ? '#f59e0b' : '#475569'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      {t.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📁 {t.project.name}</span>
                      <span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status.replace('_', ' ')}</span>
                      <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                      {t.dueDate && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: (new Date(t.dueDate) < new Date() && t.status !== 'DONE') ? 'var(--accent-red)' : 'var(--text-muted)',
                          fontWeight: (new Date(t.dueDate) < new Date() && t.status !== 'DONE') ? 600 : 400
                        }}>
                          📅 {fmt(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
