import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    return Response.json({ task })
  } catch (error) {
    console.error('[TASK_GET]', error)
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
    const userId = request.headers.get('x-user-id')!
    const body = await request.json()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    // Members can only update the status of tasks assigned to them
    if (role !== 'ADMIN') {
      if (task.assigneeId !== userId) {
        return Response.json({ error: 'Forbidden: You can only update your own tasks' }, { status: 403 })
      }
      // Members can only change status
      const allowedFields = ['status']
      const updateData: Record<string, unknown> = {}
      for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field]
      }

      const updated = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      })
      return Response.json({ task: updated })
    }

    // Admin can update everything
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    })

    return Response.json({ task: updated })
  } catch (error) {
    console.error('[TASK_PATCH]', error)
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

    await prisma.task.delete({ where: { id } })
    return Response.json({ message: 'Task deleted' })
  } catch (error) {
    console.error('[TASK_DELETE]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
