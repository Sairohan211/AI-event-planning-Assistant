# AuraPlan - Gemini AI Event Planner & Academy

A premium, full-stack Generative AI event-planning and coordinator training application. AuraPlan helps organizers coordinate schedule timelines, seating layouts, vendor quotes, task dependencies, guest check-ins, and budget analytics. It also includes an integrated learning suite where coordinators can generate study notes on any topic and take interactive training quizzes graded by AI.

---

## 🚀 Key Features

### 1. Event Planning Workflow
- **Multi-step Requirements Wizard**: Input event titles, objectives, capacity scales, target dates, venues, budgets, and organize permissioned co-planner teams.
- **Run of Show (Agenda)**: Plan minute-by-minute session schedules with speaker tags.
- **Budget Tracking**: Register vendor quotes, categories, and bid statuses. Calculate estimates vs actual expenditures dynamically with interactive charts.
- **Logistics Center**: Manage staging layout descriptions, round-table seating maps, equipment checklists, and staffing rosters.
- **Guest List Manager**: Register guest dietary warnings, toggle instant check-in, and manage RSVPs.
- **Collaborator Portals**: Secure access based on roles (`organizer`, `vendor`, `attendee`).

### 2. Generative AI Capabilities (Google Gemini)
- **Concept Brief Drafting**: Spawns theme briefs and structural guidelines.
- **Timeline Runner**: Generates readiness schedules and timelines.
- **Budget Allocation Suggestions**: Recommends segment ratios (e.g. Catering, Staging) based on the event scale.
- **Outreach Messages**: Auto-generates vendor inquiries and guest invitation scripts.
- **Risk Assessment & Backup Contingencies**: Identifies logistics risks and details contingency responses.
- **Training Lecture generator**: Generates lecture notes on any event-planning discipline.
- **Practice Quizzes**: Generates interactive 5-question multiple-choice quizzes with explanations.

### 3. Integrated Learning Suite (Academy)
- Create specialized training modules.
- Play interactive quizzes, view instant grading feedback, and review detailed answer explanations.
- Save and query learning history logs on the profile page.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router DOM (SPA SPA routes), Tailwind CSS (Premium Dark/Glass theme), Axios, Recharts (Pie & Bar charts), Lucide React.
- **Backend**: Node.js, Express.js, JWT (Stateless Token Authentication), bcryptjs (Password Hashing), Zod (Strict schema validation).
- **Database**: Dual-driver abstraction:
  - **Supabase PostgreSQL** via `pg` pool.
  - **SQLite** database (`./data/application.db`) automatic fallback out-of-the-box for seamless zero-config local testing.
  - Automated tables initialization on start.

---

## ⚙️ Local Development Setup

### Prerequisite
Ensure Node.js (LTS version) is installed.

### 1. Clone the repository and install dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` folder:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=yoursupersecretjwtkey
GEMINI_API_KEY=YOUR_REAL_GOOGLE_STUDIO_API_KEY
GEMINI_MODEL=gemini-1.5-flash
# Optional: To use Supabase PostgreSQL, add the connection string. If left blank, SQLite is used automatically!
DATABASE_URL=
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Launch Development Servers

Start the Backend Server:
```bash
cd backend
npm run dev
```

Start the Frontend Dev Server:
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Security & Design Practices

- **Zero-Exposure Keys**: The Gemini API key is processed exclusively on the Node.js backend.
- **Data Validation & Protection**: Schema verification handles inputs. Route endpoints verify resource ownership and role permissions.
- **Modern Aesthetics**: Rich purple neon gradients, backdrop glassmorphism panels, and smooth animations optimized for high-end desktop and mobile devices.
