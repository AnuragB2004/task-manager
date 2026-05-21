'use client'
import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import s from './page.module.css'

interface User { id: string; name: string; email: string; role: string }
interface Task {
  id: string; title: string; description: string | null
  status: string; priority: string; dueDate: string | null
  assignee: User | null; creator: { id: string; name: string }
}
interface Member { id: string; userId: string; user: User }
interface Project {
  id: string; name: string; description: string | null
  creator: User; members: Member[]; tasks: Task[]
}

const COLS = [
  { key: 'TODO',        label: 'To Do',      color: '#94a3b8' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#6366f1' },
  { key: 'REVIEW',      label: 'Review',      color: '#f59e0b' },
  { key: 'DONE',        label: 'Done',        color: '#10b981' },
]
const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent'
}

function fmt(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function overdue(d: string | null, status: string) {
  return !!d && status !== 'DONE' && new Date(d) < new Date()
}
function initials(n: string) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'kanban' | 'members'>('kanban')

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskError, setTaskError] = useState('')

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)

  const isAdmin = me?.role === 'ADMIN'

  const load = useCallback(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => setProject(d.project))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user))
  }, [load])

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/users').then(r => r.json()).then(d => setAllUsers(d.users || []))
    }
  }, [isAdmin])

  // Status update from task card dropdown
  const updateTaskStatus = async (taskId: string, status: string) => {
    setProject(p => p ? {
      ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    } : p)
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  // Save task (create or edit)
  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaskError('')
    setTaskSaving(true)
    try {
      const url = editTask ? `/api/tasks/${editTask.id}` : `/api/projects/${id}/tasks`
      const method = editTask ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          dueDate: taskForm.dueDate || null,
          assigneeId: taskForm.assigneeId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setTaskError(data.error || 'Failed'); return }
      setShowTaskModal(false)
      setEditTask(null)
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
      load()
    } catch { setTaskError('Network error') }
    finally { setTaskSaving(false) }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    load()
  }

  const openEditTask = (task: Task) => {
    setEditTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assigneeId: task.assignee?.id || '',
    })
    setShowTaskModal(true)
  }

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberSaving(true)
    await fetch(`/api/projects/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberUserId }),
    })
    setShowMemberModal(false)
    setMemberUserId('')
    setMemberSaving(false)
    load()
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the project?')) return
    await fetch(`/api/projects/${id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    load()
  }

  const memberIds = project?.members.map(m => m.userId) || []
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id))

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 6, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '60%', borderRadius: 6, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Project not found</h3>
            <Link href="/projects" className="btn btn-primary" style={{ marginTop: 8 }}>← Back to Projects</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className={s.header}>
          <div className={s.breadcrumb}>
            <Link href="/projects">Projects</Link>
            <span>›</span>
            <span>{project.name}</span>
          </div>
          <div className={s.titleRow}>
            <div className={s.titleLeft}>
              <h1 className={s.projectTitle}>{project.name}</h1>
              {project.description && <p className={s.projectDesc}>{project.description}</p>}
            </div>
            <div className={s.titleActions}>
              {isAdmin && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('members')}>
                    👥 {project.members.length} Members
                  </button>
                  <button id="add-task-btn" className="btn btn-primary btn-sm" onClick={() => {
                    setEditTask(null)
                    setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
                    setShowTaskModal(true)
                  }}>
                    + Add Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${activeTab === 'kanban' ? s.active : ''}`} onClick={() => setActiveTab('kanban')}>
            📋 Kanban Board
          </button>
          <button className={`${s.tab} ${activeTab === 'members' ? s.active : ''}`} onClick={() => setActiveTab('members')}>
            👥 Team ({project.members.length})
          </button>
        </div>

        {/* KANBAN */}
        {activeTab === 'kanban' && (
          <div className={s.kanban}>
            {COLS.map(col => {
              const tasks = project.tasks.filter(t => t.status === col.key)
              return (
                <div key={col.key} className={s.column}>
                  <div className={s.columnHeader}>
                    <div className={s.columnTitle}>
                      <div className={s.columnDot} style={{ background: col.color }} />
                      {col.label}
                    </div>
                    <span className={s.columnCount}>{tasks.length}</span>
                  </div>
                  <div className={s.columnCards}>
                    {tasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No tasks
                      </div>
                    )}
                    {tasks.map((task, ti) => (
                      <div key={task.id} className={s.taskCard} style={{ animationDelay: `${ti * 0.04}s` }}>
                        <div className={s.taskCardTitle}>{task.title}</div>
                        <div className={s.taskCardMeta}>
                          <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                          {/* Status selector */}
                          {(isAdmin || task.assignee?.id === me?.id) && (
                            <select
                              className={s.statusSelect}
                              value={task.status}
                              onChange={e => updateTaskStatus(task.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          )}
                          {task.dueDate && (
                            <span className={`${s.taskDue} ${overdue(task.dueDate, task.status) ? s.overdue : ''}`}>
                              📅 {fmt(task.dueDate)}
                            </span>
                          )}
                        </div>
                        {task.assignee && (
                          <div className={s.assigneeChip}>
                            <div className={s.assigneeAvatar}>{initials(task.assignee.name)}</div>
                            {task.assignee.name}
                          </div>
                        )}
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => openEditTask(task)}>✏️ Edit</button>
                            <button className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              onClick={() => deleteTask(task.id)}>🗑️</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MEMBERS */}
        {activeTab === 'members' && (
          <div>
            {isAdmin && (
              <div style={{ marginBottom: 20 }}>
                <button id="add-member-btn" className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                  + Add Member
                </button>
              </div>
            )}
            <div className={s.memberGrid}>
              {project.members.map((m, i) => (
                <div key={m.id} className={s.memberCard} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`avatar avatar-lg`}>{initials(m.user.name)}</div>
                  <div className={s.memberInfo}>
                    <div className={s.memberName}>{m.user.name}</div>
                    <div className={s.memberEmail}>{m.user.email}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${m.user.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                        {m.user.role}
                      </span>
                    </div>
                  </div>
                  {isAdmin && m.userId !== me?.id && (
                    <button className={s.removeBtn} onClick={() => removeMember(m.userId)} title="Remove member">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <Modal
            title={editTask ? 'Edit Task' : 'Create New Task'}
            onClose={() => { setShowTaskModal(false); setTaskError('') }}
          >
            <form onSubmit={saveTask} className={s.modalForm}>
              <div className="form-group">
                <label className="label" htmlFor="task-title">Title *</label>
                <input id="task-title" className="input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="task-desc">Description</label>
                <textarea id="task-desc" className="textarea" placeholder="Optional details..." value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={s.formRow}>
                <div className="form-group">
                  <label className="label" htmlFor="task-status">Status</label>
                  <select id="task-status" className="select" value={taskForm.status}
                    onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" className="select" value={taskForm.priority}
                    onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className={s.formRow}>
                <div className="form-group">
                  <label className="label" htmlFor="task-due">Due Date</label>
                  <input id="task-due" className="input" type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="task-assignee">Assignee</label>
                  <select id="task-assignee" className="select" value={taskForm.assigneeId}
                    onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {taskError && <div className="form-error">⚠️ {taskError}</div>}
              <div className={s.modalActions}>
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowTaskModal(false); setTaskError('') }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskSaving}>
                  {taskSaving ? 'Saving...' : editTask ? '✓ Update Task' : '✓ Create Task'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Member Modal */}
        {showMemberModal && (
          <Modal title="Add Team Member" onClose={() => setShowMemberModal(false)}>
            <form onSubmit={addMember} className={s.modalForm}>
              <div className="form-group">
                <label className="label" htmlFor="member-select">Select User</label>
                <select id="member-select" className="select" value={memberUserId}
                  onChange={e => setMemberUserId(e.target.value)} required>
                  <option value="">Choose a user...</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              {nonMembers.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All users are already members of this project.</p>
              )}
              <div className={s.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={memberSaving || !memberUserId}>
                  {memberSaving ? 'Adding...' : '✓ Add Member'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}
