'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import s from './page.module.css'

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  creator: { id: string; name: string; email: string }
  _count: { tasks: number; members: number }
}

const EMOJIS = ['📁', '🚀', '💡', '🎯', '🔧', '🌐', '📱', '🎨', '📊', '⚡']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user?.role === 'ADMIN') setIsAdmin(true) })
  }, [])

  const loadProjects = () => {
    setLoading(true)
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create project'); return }
      setProjects(p => [data.project, ...p])
      setShowModal(false)
      setForm({ name: '', description: '' })
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const emojiFor = (id: string) => EMOJIS[id.charCodeAt(0) % EMOJIS.length]

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              {isAdmin ? 'Manage all team projects' : 'Your assigned projects'}
            </p>
          </div>
          {isAdmin && (
            <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New Project
            </button>
          )}
        </div>

        {loading ? (
          <div className={s.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ gap: 14, display: 'flex', flexDirection: 'column' }}>
                <div className="skeleton" style={{ height: 44, width: 44, borderRadius: 10 }} />
                <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 13, width: '50%', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No projects yet</h3>
            <p>{isAdmin ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}</p>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
            )}
          </div>
        ) : (
          <div className={s.grid}>
            {projects.map((p, i) => (
              <Link
                href={`/projects/${p.id}`}
                key={p.id}
                className={s.projectCard}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={s.cardHeader}>
                  <div className={s.cardIcon}>{emojiFor(p.id)}</div>
                </div>
                <div>
                  <div className={s.cardTitle}>{p.name}</div>
                  {p.description && <div className={s.cardDesc} style={{ marginTop: 4 }}>{p.description}</div>}
                </div>
                <div className={s.cardStats}>
                  <div className={s.cardStat}>
                    <span>✅</span>
                    <span><span className={s.cardStatVal}>{p._count.tasks}</span> tasks</span>
                  </div>
                  <div className={s.cardStat}>
                    <span>👥</span>
                    <span><span className={s.cardStatVal}>{p._count.members}</span> members</span>
                  </div>
                </div>
                <div className={s.cardFooter}>
                  <div className={s.creator}>
                    <div className="avatar" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                      {p.creator.name.slice(0, 2).toUpperCase()}
                    </div>
                    {p.creator.name}
                  </div>
                  <span>{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showModal && (
          <Modal title="Create New Project" onClose={() => { setShowModal(false); setError('') }}>
            <form onSubmit={handleCreate} className={s.formStack}>
              <div className="form-group">
                <label className="label" htmlFor="proj-name">Project Name *</label>
                <input
                  id="proj-name"
                  className="input"
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  className="textarea"
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {error && <div className="form-error">⚠️ {error}</div>}
              <div className={s.actions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : '✓ Create Project'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}
