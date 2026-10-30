// Esquema compartilhado pelo app e pelos testes com SQLite real.
export const SCHEMA_VERSION = 1;
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
      await db.execAsync(SCHEMA_SQL);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }
}
