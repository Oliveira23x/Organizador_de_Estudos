import { DatabaseSync } from 'node:sqlite';

// O mesmo SQL dos repositórios roda em SQLite real, sem simular consultas.
export class SQLiteAdapter {
  constructor(path = ':memory:') {
    this.database = new DatabaseSync(path);
  }
  async execAsync(sql) {
    this.database.exec(sql);
  }
  async getFirstAsync(sql, ...params) {
    return this.database.prepare(sql).get(...params) || null;
  }
  async getAllAsync(sql, ...params) {
    return this.database.prepare(sql).all(...params);
  }
  async runAsync(sql, ...params) {
    const result = this.database.prepare(sql).run(...params);
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  }
  async withTransactionAsync(operation) {
    this.database.exec('BEGIN');
    try {
      await operation();
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
  async closeAsync() {
    this.database.close();
  }
}
