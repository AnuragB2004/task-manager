import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
    return Response.json({ members })
  } catch (error) {
    console.error('[PROJECT_MEMBERS_GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = request.headers.get('x-user-role')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 })
    }

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    })
    if (existing) {
      return Response.json({ error: 'User is already a member' }, { status: 409 })
    }

    const member = await prisma.projectMember.create({
      data: { userId, projectId: id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })

    return Response.json({ member }, { status: 201 })
  } catch (error) {
    console.error('[PROJECT_MEMBERS_POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = request.headers.get('x-user-role')!
    const currentUserId = request.headers.get('x-user-id')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 })
    }

    if (userId === currentUserId) {
      return Response.json({ error: 'Cannot remove yourself from the project' }, { status: 400 })
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: id } },
    })

    return Response.json({ message: 'Member removed' })
  } catch (error) {
    console.error('[PROJECT_MEMBERS_DELETE]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
