'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import s from './Sidebar.module.css'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => d.user && setUser(d.user))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path))

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const nav = (
    <nav className={s.nav}>
      <div className={s.navSection}>
        <div className={s.navSectionLabel}>Overview</div>
        <Link href="/dashboard" className={`${s.navItem} ${isActive('/dashboard') ? s.active : ''}`}>
          <span className={s.navIcon}>📊</span> Dashboard
        </Link>
      </div>
      <div className={s.navSection}>
        <div className={s.navSectionLabel}>Work</div>
        <Link href="/projects" className={`${s.navItem} ${isActive('/projects') ? s.active : ''}`}>
          <span className={s.navIcon}>📁</span> Projects
        </Link>
        <Link href="/tasks" className={`${s.navItem} ${isActive('/tasks') ? s.active : ''}`}>
          <span className={s.navIcon}>✅</span> My Tasks
        </Link>
      </div>
      {user?.role === 'ADMIN' && (
        <div className={s.navSection}>
          <div className={s.navSectionLabel}>Admin</div>
          <Link href="/admin/users" className={`${s.navItem} ${isActive('/admin') ? s.active : ''}`}>
            <span className={s.navIcon}>👥</span> Users
          </Link>
        </div>
      )}
    </nav>
  )

  return (
    <>
      {/* Mobile header */}
      <header className={s.mobileHeader}>
        <button className={s.hamburger} onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          {mobileOpen ? '✕' : '☰'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className={s.logoIcon}>⚡</div>
          <span className={s.logoText}>TaskFlow</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Overlay */}
      {mobileOpen && <div className={s.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${s.sidebar} ${mobileOpen ? s.open : ''}`}>
        <Link href="/dashboard" className={s.logo}>
          <div className={s.logoIcon}>⚡</div>
          <div>
            <div className={s.logoText}>TaskFlow</div>
            <div className={s.logoSub}>Team Manager</div>
          </div>
        </Link>

        {nav}

        <div className={s.userSection}>
          {user ? (
            <div className={s.userCard}>
              <div className="avatar">{initials(user.name)}</div>
              <div className={s.userInfo}>
                <div className={s.userName}>{user.name}</div>
                <div className={s.userEmail}>{user.role}</div>
              </div>
              <button className={s.logoutBtn} onClick={handleLogout} title="Sign out">⏻</button>
            </div>
          ) : (
            <div className={s.userCard}>
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ height: 12, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
