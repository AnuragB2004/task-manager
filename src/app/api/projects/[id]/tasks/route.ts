import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    })
    return Response.json({ tasks })
  } catch (error) {
    console.error('[PROJECT_TASKS_GET]', error)
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
    const userId = request.headers.get('x-user-id')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { title, description, status, priority, dueDate, assigneeId } = await request.json()

    if (!title?.trim()) {
      return Response.json({ error: 'Task title is required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: id,
        assigneeId: assigneeId || null,
        creatorId: userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    })

    return Response.json({ task }, { status: 201 })
  } catch (error) {
    console.error('[PROJECT_TASKS_POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
