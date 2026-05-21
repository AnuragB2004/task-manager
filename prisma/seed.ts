import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.dev' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskflow.dev',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create Member users
  const memberPassword = await bcrypt.hash('member123', 12)
  const member1 = await prisma.user.upsert({
    where: { email: 'alice@taskflow.dev' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@taskflow.dev',
      password: memberPassword,
      role: 'MEMBER',
    },
  })

  const member2 = await prisma.user.upsert({
    where: { email: 'bob@taskflow.dev' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@taskflow.dev',
      password: memberPassword,
      role: 'MEMBER',
    },
  })

  // Create Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI/UX principles.',
      creatorId: admin.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-project-2' },
    update: {},
    create: {
      id: 'seed-project-2',
      name: 'Mobile App MVP',
      description: 'Build the MVP of our mobile application for iOS and Android.',
      creatorId: admin.id,
    },
  })

  // Add members to projects
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: admin.id, projectId: project1.id } },
    update: {},
    create: { userId: admin.id, projectId: project1.id },
  })
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: member1.id, projectId: project1.id } },
    update: {},
    create: { userId: member1.id, projectId: project1.id },
  })
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: member2.id, projectId: project1.id } },
    update: {},
    create: { userId: member2.id, projectId: project1.id },
  })
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: admin.id, projectId: project2.id } },
    update: {},
    create: { userId: admin.id, projectId: project2.id },
  })
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: member1.id, projectId: project2.id } },
    update: {},
    create: { userId: member1.id, projectId: project2.id },
  })

  const yesterday = new Date(Date.now() - 86400000)
  const nextWeek = new Date(Date.now() + 7 * 86400000)
  const nextMonth = new Date(Date.now() + 30 * 86400000)

  // Create Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        title: 'Design System Setup',
        description: 'Create color palette, typography and spacing tokens.',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: member1.id,
        creatorId: admin.id,
        dueDate: yesterday,
      },
      {
        title: 'Homepage Hero Section',
        description: 'Design and implement the hero section with animations.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: member2.id,
        creatorId: admin.id,
        dueDate: nextWeek,
      },
      {
        title: 'Navigation Component',
        description: 'Build responsive navigation with mobile hamburger menu.',
        status: 'REVIEW',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: member1.id,
        creatorId: admin.id,
        dueDate: nextWeek,
      },
      {
        title: 'Footer & Contact Form',
        description: 'Implement footer links and a working contact form.',
        status: 'TODO',
        priority: 'LOW',
        projectId: project1.id,
        assigneeId: member2.id,
        creatorId: admin.id,
        dueDate: nextMonth,
      },
      {
        title: 'SEO Optimization',
        description: 'Add meta tags, sitemap and structured data.',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: null,
        creatorId: admin.id,
        dueDate: nextMonth,
      },
    ],
    skipDuplicates: true,
  })

  // Create Tasks for Project 2
  await prisma.task.createMany({
    data: [
      {
        title: 'API Integration',
        description: 'Integrate REST APIs with the mobile app.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        projectId: project2.id,
        assigneeId: member1.id,
        creatorId: admin.id,
        dueDate: yesterday,
      },
      {
        title: 'Push Notification Setup',
        description: 'Configure Firebase Cloud Messaging for push notifications.',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project2.id,
        assigneeId: member1.id,
        creatorId: admin.id,
        dueDate: nextWeek,
      },
      {
        title: 'User Authentication Flow',
        description: 'Implement login, signup and token refresh flow.',
        status: 'DONE',
        priority: 'URGENT',
        projectId: project2.id,
        assigneeId: member1.id,
        creatorId: admin.id,
        dueDate: yesterday,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Admin: admin@taskflow.dev / admin123`)
  console.log(`Member 1: alice@taskflow.dev / member123`)
  console.log(`Member 2: bob@taskflow.dev / member123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
