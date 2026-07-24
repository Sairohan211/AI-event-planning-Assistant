-- Schema for Event Planning and Learning Assistant

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'organizer', -- 'organizer', 'vendor', 'attendee'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'Conference', 'Wedding', 'Concert', 'Birthday'
  objective TEXT,
  date TEXT NOT NULL, -- ISO timestamp
  venue TEXT,
  capacity INTEGER DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  audience TEXT,
  organizing_team TEXT, -- JSON string representing organizers and their permissions
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agenda_sessions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL, -- ISO timestamp
  end_time TEXT NOT NULL, -- ISO timestamp
  speaker TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'blocked', 'approved', 'completed'
  dependency_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  deadline TEXT,
  blocker TEXT,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Catering', 'AV/Lighting', 'Venue Decoration', 'Security', etc.
  quotation NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  contact_email TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendees (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  dietary_needs TEXT,
  invitation_status TEXT DEFAULT 'sent', -- 'sent', 'confirmed', 'declined'
  check_in_status BOOLEAN DEFAULT FALSE,
  seating_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logistics_plans (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seating_layout TEXT,
  room_setup TEXT,
  equipment TEXT, -- JSON string
  staffing TEXT, -- JSON string
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_plans (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  concept TEXT,
  timeline TEXT, -- JSON string
  budget_allocation TEXT, -- JSON string
  vendor_messages TEXT, -- JSON string
  guest_messages TEXT, -- JSON string
  risks_contingencies TEXT, -- JSON string
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  questions TEXT NOT NULL, -- JSON string of quiz questions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers TEXT NOT NULL, -- JSON string of user answers
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
