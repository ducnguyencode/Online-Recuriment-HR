# Online-Recuriment-HR - Database Setup and Project Connection Guide

This guide creates a fresh PostgreSQL database for the current project, loads schema, inserts full sample data, and connects backend/frontend to that database.

## 1) Prerequisites

- PostgreSQL 14+ installed and running on your machine
- Node.js 18+ and npm
- `psql` command available (or use pgAdmin query tool)

## 2) Create the project database

Run in PowerShell:

```powershell
psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE online_recruitment;"
```

If the database already exists, skip this step.

## 3) Import schema (tables, enums, indexes, base demo accounts)

```powershell
psql -U postgres -h localhost -p 5432 -d online_recruitment -f "backend/scripts/init-schema.sql"
```

## 4) Import full sample data

This script truncates and reseeds business data with a complete local dataset:

```powershell
psql -U postgres -h localhost -p 5432 -d online_recruitment -f "backend/scripts/seed-full-data.sql"
```

Seed file location:
- `backend/scripts/seed-full-data.sql`

## 5) Configure backend connection

Edit `backend/.env` to match your local PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123456789
DB_NAME=online_recruitment
DB_SYNC=false
```

Also keep:

```env
PORT=3000
APP_PUBLIC_URL=http://localhost:4200
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## 6) Install and run project

Backend:

```powershell
cd backend
npm install
npm run start:dev
```

Frontend (new terminal):

```powershell
cd frontend
npm install
npm run start
```

## 7) Confirm API <-> DB connectivity

Quick checks:

```powershell
psql -U postgres -h localhost -p 5432 -d online_recruitment -c "SELECT COUNT(*) FROM users;"
psql -U postgres -h localhost -p 5432 -d online_recruitment -c "SELECT COUNT(*) FROM vacancies;"
psql -U postgres -h localhost -p 5432 -d online_recruitment -c "SELECT COUNT(*) FROM applications;"
```

Expected non-zero counts after running the seed script.

## 8) Full data seeded by this setup

### Login accounts (all passwords: `123456`)

- `superadmin@demo.local` -> role `SUPERADMIN`
- `hr@demo.local` -> role `HR`
- `interviewer@demo.local` -> role `INTERVIEWER`
- `applicant@demo.local` -> role `APPLICANT`
- plus applicant users:
  - `alice.nguyen@example.com`
  - `brian.tran@example.com`
  - `cindy.le@example.com`
  - `david.pham@example.com`

### Departments

- Engineering
- Human Resources
- Product
- Design

### Vacancies

- Senior Backend Engineer
- Frontend Angular Developer
- Technical Recruiter
- Product Manager
- Product Designer

### Applicants

- Alice Nguyen
- Brian Tran
- Cindy Le
- David Pham
- Demo Applicant

### CV rows

- 1 CV for each applicant above

### Applications (status mix)

- Pending
- Screening
- Interview Scheduled
- Selected
- Rejected

### Interviews

- Backend Technical Interview
- HR Culture Interview

### Activity logs

- Vacancy creation event
- Application creation event
- Interview scheduling event

## 9) If you imported another DB and columns mismatch

Run:

```powershell
cd backend
npm run db:patch-users
```

This patches missing `users` columns for older schemas.

---

If you want, I can also generate a second seed script for "empty but realistic production-like" data (no demo emails, no mock interviews), while keeping this one for local QA.
