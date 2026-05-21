import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const role = request.headers.get('x-user-role')!

    const now = new Date()

    let totalTasks, doneTasks, inProgressTasks, overdueTasks, myTasks

    if (role === 'ADMIN') {
      totalTasks = await prisma.task.count()
      doneTasks = await prisma.task.count({ where: { status: 'DONE' } })
      inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } })
      overdueTasks = await prisma.task.findMany({
        where: { dueDate: { lt: now }, status: { not: 'DONE' } },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      })
      myTasks = await prisma.task.findMany({
        where: { assigneeId: userId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      })
    } else {
      totalTasks = await prisma.task.count({ where: { assigneeId: userId } })
      doneTasks = await prisma.task.count({ where: { assigneeId: userId, status: 'DONE' } })
      inProgressTasks = await prisma.task.count({ where: { assigneeId: userId, status: 'IN_PROGRESS' } })
      overdueTasks = await prisma.task.findMany({
        where: { assigneeId: userId, dueDate: { lt: now }, status: { not: 'DONE' } },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      })
      myTasks = await prisma.task.findMany({
        where: { assigneeId: userId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      })
    }

    const todoTasks = role === 'ADMIN'
      ? await prisma.task.count({ where: { status: 'TODO' } })
      : await prisma.task.count({ where: { assigneeId: userId, status: 'TODO' } })

    const reviewTasks = role === 'ADMIN'
      ? await prisma.task.count({ where: { status: 'REVIEW' } })
      : await prisma.task.count({ where: { assigneeId: userId, status: 'REVIEW' } })

    const totalProjects = role === 'ADMIN'
      ? await prisma.project.count()
      : await prisma.projectMember.count({ where: { userId } })

    const recentTasks = await prisma.task.findMany({
      where: role === 'ADMIN' ? {} : { assigneeId: userId },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    })

    return Response.json({
      stats: {
        totalTasks,
        doneTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        overdueCount: overdueTasks.length,
        totalProjects,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      overdueTasks,
      myTasks,
      recentTasks,
    })
  } catch (error) {
    console.error('[DASHBOARD_GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
