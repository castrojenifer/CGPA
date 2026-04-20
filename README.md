# 🎓 CGPA Calculator

A modern, responsive CGPA Calculator web application for college students with a premium glassmorphism UI.

## Features

- **🔐 Authentication** — Student & Admin login/signup with Supabase Auth
- **📊 Student Dashboard** — View GPA, CGPA, semester history at a glance
- **🧮 Semester Calculator** — Add subjects dynamically, calculate GPA instantly
- **🎯 Goal Tracker** — Set target CGPA, see required GPA for upcoming semesters
- **📈 Analytics** — Beautiful bar charts, line graphs, and trend visualizations
- **📄 PDF Reports** — Download comprehensive academic reports
- **🌙 Dark Mode** — Toggle between light and dark themes (persisted)
- **🛡️ Admin Panel** — Manage departments, subjects, students, and reports

## Tech Stack

| Layer    | Technology           |
|----------|---------------------|
| Frontend | React + Vite        |
| Styling  | Tailwind CSS 3      |
| Backend  | Node.js + Express   |
| Database | Supabase (Postgres) |
| Charts   | Recharts            |
| PDF      | jsPDF + AutoTable   |
| Icons    | Lucide React        |

## Project Structure

```
cgpa/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Theme providers
│   │   ├── lib/            # Supabase client & calculations
│   │   ├── pages/          # Route pages
│   │   │   └── admin/      # Admin-only pages
│   │   ├── App.jsx         # Root component with routing
│   │   └── index.css       # Tailwind + custom styles
│   └── .env.example
├── server/                 # Express backend
│   ├── server.js
│   └── .env.example
└── supabase/
    └── schema.sql          # Database schema + RLS policies
```

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 2. Client Setup

```bash
cd client
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

### 3. Server Setup (optional — for admin reports API)

```bash
cd server
cp .env.example .env
# Edit .env with your Supabase URL and service role key
npm install
npm run dev
```

### 4. Open the App

Visit `http://localhost:5173` in your browser.

## GPA Scale (10-point)

| Grade | Points |
|-------|--------|
| O     | 10     |
| A+    | 9      |
| A     | 8      |
| B+    | 7      |
| B     | 6      |
| C     | 5      |
| P     | 4      |
| F     | 0      |

## Environment Variables

### Client (`client/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Server (`server/.env`)
```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=http://localhost:5173
```

## License

MIT
