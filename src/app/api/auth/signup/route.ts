import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true },
    })

    const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name })
    await setAuthCookie(token)

    return Response.json({ user }, { status: 201 })
  } catch (error) {
    console.error('[SIGNUP_ERROR]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
