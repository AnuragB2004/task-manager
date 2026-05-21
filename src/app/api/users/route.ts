import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    })

    return Response.json({ users })
  } catch (error) {
    console.error('[USERS_GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
