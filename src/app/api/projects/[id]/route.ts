import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')!
    const role = request.headers.get('x-user-role')!

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Members can only access projects they belong to
    if (role !== 'ADMIN') {
      const isMember = project.members.some((m) => m.userId === userId)
      if (!isMember) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return Response.json({ project })
  } catch (error) {
    console.error('[PROJECT_GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = request.headers.get('x-user-role')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return Response.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name: name.trim(), description: description?.trim() || null },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, members: true } },
      },
    })

    return Response.json({ project })
  } catch (error) {
    console.error('[PROJECT_PATCH]', error)
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

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    await prisma.project.delete({ where: { id } })
    return Response.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('[PROJECT_DELETE]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
