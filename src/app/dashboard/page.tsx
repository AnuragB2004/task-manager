'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import s from './page.module.css'

interface Stats {
  totalTasks: number
  doneTasks: number
  inProgressTasks: number
  todoTasks: number
  reviewTasks: number
  overdueCount: number
  totalProjects: number
  completionRate: number
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  project: { id: string; name: string }
  assignee: { id: string; name: string } | null
}

const statusColor: Record<string, string> = {
  TODO: '#94a3b8', IN_PROGRESS: '#6366f1', REVIEW: '#f59e0b', DONE: '#10b981',
}
const priorityBadge: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function isOverdue(d: string | null) {
  if (!d) return false
  return new Date(d) < new Date()
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        setStats(d.stats)
        setOverdueTasks(d.overdueTasks || [])
        setRecentTasks(d.recentTasks || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: 'purple' },
    { label: 'Completed', value: stats.doneTasks, icon: '✅', color: 'green' },
    { label: 'In Progress', value: stats.inProgressTasks, icon: '⚡', color: 'cyan' },
    { label: 'Overdue', value: stats.overdueCount, icon: '⚠️', color: 'red' },
    { label: 'In Review', value: stats.reviewTasks, icon: '🔍', color: 'amber' },
    { label: 'Projects', value: stats.totalProjects, icon: '📁', color: 'purple' },
  ] : []

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Track your team&apos;s progress at a glance</p>
          </div>
          <Link href="/projects" className="btn btn-primary btn-sm">+ New Project</Link>
        </div>

        {loading ? (
          <div className={s.statGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={s.statCard}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 32, width: '60%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={s.statGrid}>
              {statCards.map((c, i) => (
                <div key={i} className={s.statCard} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className={`${s.statIcon} ${s[c.color]}`}>{c.icon}</div>
                  <div>
                    <div className={s.statValue}>{c.value}</div>
                    <div className={s.statLabel}>{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Progress */}
            {stats && (
              <div className={s.progressCard} style={{ marginBottom: 20 }}>
                <div className={s.progressHeader}>
                  <div>
                    <div className={s.progressTitle}>Overall Completion Rate</div>
                    <p style={{ fontSize: '0.8rem', marginTop: 2 }}>Based on all tracked tasks</p>
                  </div>
                  <div className={s.progressPct}>{stats.completionRate}%</div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.completionRate}%` }} />
                </div>
                <div className={s.statusRow}>
                  {[
                    { label: `${stats.todoTasks} To Do`, color: statusColor.TODO },
                    { label: `${stats.inProgressTasks} In Progress`, color: statusColor.IN_PROGRESS },
                    { label: `${stats.reviewTasks} Review`, color: statusColor.REVIEW },
                    { label: `${stats.doneTasks} Done`, color: statusColor.DONE },
                  ].map((chip, i) => (
                    <div key={i} className={s.statusChip}>
                      <div className={s.statusDot} style={{ background: chip.color }} />
                      {chip.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={s.contentGrid}>
              {/* Overdue Tasks */}
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <span className={s.sectionTitle}>⚠️ Overdue Tasks</span>
                  <span className="badge badge-urgent">{overdueTasks.length}</span>
                </div>
                {overdueTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div className="empty-state-icon">🎉</div>
                    <h3>All caught up!</h3>
                    <p>No overdue tasks right now.</p>
                  </div>
                ) : (
                  <div className={s.taskList}>
                    {overdueTasks.map(t => (
                      <Link href={`/projects/${t.project.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                        <div className={s.taskRow}>
                          <div className={s.statusDot} style={{ background: statusColor[t.status], marginTop: 5, flexShrink: 0 }} />
                          <div className={s.taskInfo}>
                            <div className={s.taskTitle}>{t.title}</div>
                            <div className={s.taskMeta}>
                              <span>{t.project.name}</span>
                              {t.dueDate && <span className={s.overdueDate}>Due {formatDate(t.dueDate)}</span>}
                              <span className={`badge ${priorityBadge[t.priority]}`}>{t.priority}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link href="/tasks" className={s.viewAll}>View all tasks →</Link>
              </div>

              {/* Recent Activity */}
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <span className={s.sectionTitle}>🕐 Recent Activity</span>
                </div>
                {recentTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div className="empty-state-icon">📭</div>
                    <h3>No activity yet</h3>
                    <p>Tasks you work on will appear here.</p>
                  </div>
                ) : (
                  <div className={s.taskList}>
                    {recentTasks.map(t => (
                      <Link href={`/projects/${t.project.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                        <div className={s.taskRow}>
                          <div className={s.statusDot} style={{ background: statusColor[t.status], marginTop: 5, flexShrink: 0 }} />
                          <div className={s.taskInfo}>
                            <div className={s.taskTitle}>{t.title}</div>
                            <div className={s.taskMeta}>
                              <span>{t.project.name}</span>
                              <span className={`badge ${t.status === 'DONE' ? 'badge-done' : t.status === 'IN_PROGRESS' ? 'badge-progress' : t.status === 'REVIEW' ? 'badge-review' : 'badge-todo'}`}>
                                {t.status.replace('_', ' ')}
                              </span>
                              {t.dueDate && (
                                <span className={isOverdue(t.dueDate) && t.status !== 'DONE' ? s.overdueDate : ''}>
                                  {formatDate(t.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link href="/projects" className={s.viewAll}>View all projects →</Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
