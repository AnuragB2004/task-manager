import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
    return Response.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
