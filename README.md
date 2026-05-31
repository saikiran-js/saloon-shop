# Naturals Narasannpeta — Salon Management App

A full-stack salon management app built with React + Vite + Supabase.

## Features
- 🔐 Real authentication via Supabase Auth (email/password + password reset)
- 👑 Role-based access (Owner vs Staff) via `user_profiles` table
- 📅 Appointments — full CRUD, status filtering, search
- 👥 Employees — full CRUD (owner only)
- 🧖 Customers — full CRUD
- 💅 Services — full CRUD (owner only)
- 📊 Dashboard — live stats from real data

---

## Setup Instructions

### 1. Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon public key** from Project Settings → API

### 2. Set Environment Variables
Update `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the SQL Schema
1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run the entire contents of `SUPABASE_SETUP.sql`

### 4. Create Users
1. Go to **Supabase → Authentication → Users → Add User**
2. Create your users (e.g. admin@yoursalon.com)
3. Then in the **SQL Editor**, add their profile:
```sql
-- Make a user an owner/admin:
insert into user_profiles (id, name, role, is_admin)
values ('<paste-user-uuid-here>', 'Admin', 'Owner', true);

-- Make a user staff:
insert into user_profiles (id, name, role, is_admin)
values ('<paste-user-uuid-here>', 'Aisha Noor', 'Senior Stylist', false);
```

### 5. Run the App
```bash
npm install
npm run dev
```

---

## Database Tables

| Table | Key Columns |
|---|---|
| `employees` | name, role, phone, email, joined_date, status |
| `customers` | name, phone, email, visits, last_visit, notes |
| `services` | name, category, duration_min, price, is_active |
| `appointments` | customer_id, employee_id, service_id, date, time, status, notes |
| `user_profiles` | id (auth user), name, role, is_admin |
