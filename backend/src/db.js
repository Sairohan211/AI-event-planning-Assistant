import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClient = null;
let isPostgres = false;

const initDb = async () => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    console.log('Connecting to Supabase PostgreSQL database...');
    dbClient = new pg.Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    isPostgres = true;
  } else {
    console.log('No DATABASE_URL found. Initializing local SQLite database...');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'application.db');
    
    // Create sqlite3 database
    const sqliteDb = new sqlite3.Database(dbPath);
    
    // Promisify sqlite run, get, and all
    dbClient = {
      query: (sql, params = []) => {
        // Convert postgres $1, $2 params to sqlite ? params
        let sqliteSql = sql;
        // Simple replace for $1, $2 etc with ?
        // Be careful to do it in order or just map params
        const pgParamMatches = sql.match(/\$\d+/g);
        if (pgParamMatches) {
          pgParamMatches.forEach((match, index) => {
            sqliteSql = sqliteSql.replace(match, '?');
          });
        }

        return new Promise((resolve, reject) => {
          if (sql.trim().toLowerCase().startsWith('select')) {
            sqliteDb.all(sqliteSql, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows });
            });
          } else {
            sqliteDb.run(sqliteSql, params, function (err) {
              if (err) reject(err);
              else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
            });
          }
        });
      },
      close: () => {
        return new Promise((resolve, reject) => {
          sqliteDb.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };
    isPostgres = false;
  }

  // Create tables if they do not exist
  await createTables();
};

const createTables = async () => {
  // Define schema sql
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'organizer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      objective TEXT,
      date TEXT NOT NULL,
      venue TEXT,
      capacity INTEGER DEFAULT 0,
      budget NUMERIC DEFAULT 0,
      audience TEXT,
      organizing_team TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agenda_sessions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      speaker TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'todo',
      dependency_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      deadline TEXT,
      blocker TEXT,
      approval_status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quotation NUMERIC DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      contact_email TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendees (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      dietary_needs TEXT,
      invitation_status TEXT DEFAULT 'sent',
      check_in_status BOOLEAN DEFAULT FALSE,
      seating_info TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logistics_plans (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      seating_layout TEXT,
      room_setup TEXT,
      equipment TEXT,
      staffing TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_plans (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      concept TEXT,
      timeline TEXT,
      budget_allocation TEXT,
      vendor_messages TEXT,
      guest_messages TEXT,
      risks_contingencies TEXT,
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
      questions TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      answers TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    // In SQLite or PG, split queries and execute them
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      await dbClient.query(query);
    }
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
};

const query = (text, params) => {
  if (!dbClient) {
    throw new Error('Database client not initialized. Call initDb first.');
  }
  return dbClient.query(text, params);
};

export default {
  initDb,
  query,
  isPostgres: () => isPostgres
};
