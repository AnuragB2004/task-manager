import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const role = request.headers.get('x-user-role')!

    let projects

    if (role === 'ADMIN') {
      projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true } },
        },
      })
    } else {
      projects = await prisma.project.findMany({
        where: { members: { some: { userId } } },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true } },
        },
      })
    }

    return Response.json({ projects })
  } catch (error) {
    console.error('[PROJECTS_GET]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const role = request.headers.get('x-user-role')!

    if (role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return Response.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: userId,
        members: { create: { userId } },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, members: true } },
      },
    })

    return Response.json({ project }, { status: 201 })
  } catch (error) {
    console.error('[PROJECTS_POST]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
