// Esquema compartilhado pelo app e pelos testes com SQLite real.
export const SCHEMA_VERSION = 2;
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(name)) BETWEEN 2 AND 60),
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#197568',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  topic TEXT NOT NULL CHECK(length(trim(topic)) BETWEEN 2 AND 100),
  minutes INTEGER NOT NULL CHECK(minutes BETWEEN 1 AND 1440),
  studied_on TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 80),
  target_minutes INTEGER NOT NULL CHECK(target_minutes BETWEEN 1 AND 100000),
  start_on TEXT NOT NULL,
  end_on TEXT NOT NULL CHECK(end_on >= start_on),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_subject_date ON sessions(subject_id, studied_on);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(studied_on);
CREATE INDEX IF NOT EXISTS idx_goals_subject ON goals(subject_id);
`;

export async function initializeDatabase(db) {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync('PRAGMA user_version');
  if (row.user_version > SCHEMA_VERSION)
    throw new Error('Este banco foi criado por uma versão mais recente do aplicativo.');
  if (row.user_version < SCHEMA_VERSION) {
    await db.withTransactionAsync(async () => {
      if (row.user_version < 1) await db.execAsync(SCHEMA_SQL);
      if (row.user_version < 2) await db.execAsync(MIGRATION_V2_SQL);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }
}

export const MIGRATION_V2_SQL = `
ALTER TABLE goals ADD COLUMN goal_type TEXT NOT NULL DEFAULT 'time' CHECK(goal_type IN ('time', 'sessions'));
ALTER TABLE goals ADD COLUMN target_sessions INTEGER NOT NULL DEFAULT 1 CHECK(target_sessions BETWEEN 1 AND 1000);
CREATE TABLE revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 2 AND 100),
  planned_on TEXT NOT NULL,
  planned_minutes INTEGER NOT NULL CHECK(planned_minutes BETWEEN 1 AND 1440),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('high', 'normal', 'low')),
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'done')),
  completed_on TEXT,
  session_id INTEGER UNIQUE REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_revisions_status_date ON revisions(status, planned_on);
CREATE INDEX idx_revisions_subject ON revisions(subject_id);
CREATE TABLE focus_timer (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  topic TEXT NOT NULL CHECK(length(trim(topic)) BETWEEN 2 AND 100),
  target_minutes INTEGER NOT NULL CHECK(target_minutes BETWEEN 1 AND 180),
  accumulated_seconds INTEGER NOT NULL DEFAULT 0 CHECK(accumulated_seconds >= 0),
  started_at_ms INTEGER,
  status TEXT NOT NULL CHECK(status IN ('running', 'paused'))
);
`;
