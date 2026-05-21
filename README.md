# ⚡ TaskFlow — Team Task Manager

A full-stack, role-based team task management platform built with **Next.js 16**, **Prisma 5**, **PostgreSQL**, and **Vanilla CSS Modules**.

---

## 🚀 Features

- **Authentication** — Secure signup/login with JWT stored in HTTP-only cookies
- **Role-Based Access Control** — Admin and Member roles with enforced permissions
- **Project Management** — Create, view, and manage multiple projects
- **Kanban Board** — Drag-status task board with TODO / IN PROGRESS / REVIEW / DONE columns
- **Task Management** — Create, assign, edit, and delete tasks with priority and due dates
- **Team Management** — Add/remove members from projects
- **Dashboard** — Completion rate, overdue tasks, recent activity stats
- **My Tasks** — Filter tasks by status across all projects
- **Admin Panel** — View all registered users

---

## 🏗️ Tech Stack

| Layer       | Technology              |
|-------------|------------------------|
| Framework   | Next.js 16 (App Router) |
| Database    | PostgreSQL              |
| ORM         | Prisma 5               |
| Auth        | JWT + bcryptjs          |
| Styling     | Vanilla CSS Modules     |
| Deployment  | Railway                 |

---

## 🖥️ Local Development

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local or cloud — [Neon](https://neon.tech) works great for free)

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd task-manager

# 2. Install dependencies
npm install

# 3. Set environment variables
cp .env.example .env.local
# Edit .env.local and add your DATABASE_URL and JWT_SECRET

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed the database with sample data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts (after seeding)

| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@taskflow.dev      | admin123    |
| Member | alice@taskflow.dev      | member123   |
| Member | bob@taskflow.dev        | member123   |

---

## 🌐 Deploy to Railway

### 1. Create a Railway project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in project directory
railway init
```

### 2. Add PostgreSQL plugin

In the Railway dashboard, add a **PostgreSQL** plugin to your project. Railway will automatically set `DATABASE_URL`.

### 3. Set environment variables

In Railway dashboard → Variables, add:
```
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
NODE_ENV=production
```

### 4. Deploy

```bash
railway up
```

Railway will build the Dockerfile, run `prisma migrate deploy` automatically, and start the server.

### 5. Seed production data (optional)

```bash
railway run npm run db:seed
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # login, signup, logout, me
│   │   ├── projects/      # CRUD + members + tasks
│   │   ├── tasks/         # task CRUD
│   │   ├── dashboard/     # stats API
│   │   └── users/         # admin user list
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Auth page
│   ├── projects/          # Projects list + detail (Kanban)
│   ├── tasks/             # My Tasks page
│   └── admin/users/       # Admin user list page
├── components/
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── Modal.tsx          # Reusable modal dialog
├── lib/
│   ├── auth.ts            # JWT + bcrypt utilities
│   └── db.ts              # Prisma client singleton
└── middleware.ts           # Route protection + auth injection
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Dev seed data
```

---

## 🔐 Role Permissions

| Action                    | Admin | Member |
|---------------------------|-------|--------|
| Create projects           | ✅    | ❌     |
| View all projects         | ✅    | ❌     |
| View assigned projects    | ✅    | ✅     |
| Add/remove members        | ✅    | ❌     |
| Create/edit/delete tasks  | ✅    | ❌     |
| Update own task status    | ✅    | ✅     |
| View all users            | ✅    | ❌     |
