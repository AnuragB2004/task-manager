'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Middleware handles auth, but provide a client-side redirect fallback
    router.replace('/dashboard')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚡</div>
        <p style={{ color: 'var(--text-secondary)' }}>Redirecting...</p>
      </div>
    </div>
  )
}
