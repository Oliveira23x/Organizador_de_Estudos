const pattern = (value) =>
  `%${String(value || '')
    .trim()
    .replace(/[\\%_]/g, '\\$&')}%`;
function exists(result) {
  if (!result.changes)
    throw new Error('O registro não existe mais. Atualize a tela e tente novamente.');
  return result;
}

export class RevisionRepository {
  constructor(db) {
    this.db = db;
  }
  async find(id) {
    return this.db.getFirstAsync('SELECT * FROM revisions WHERE id = ?', id);
  }
  async list({
    search = '',
    subjectId = null,
    status = 'all',
    priority = 'all',
    sort = 'date',
    today,
    from = null,
    to = null,
  } = {}) {
    const clauses = ["(r.title LIKE ? ESCAPE '\\' OR d.name LIKE ? ESCAPE '\\')"];
    const params = [pattern(search), pattern(search)];
    if (subjectId) {
      clauses.push('r.subject_id = ?');
      params.push(Number(subjectId));
    }
    if (status === 'pending' || status === 'done') {
      clauses.push('r.status = ?');
      params.push(status);
    }
    if (status === 'today') {
      clauses.push("r.status = 'pending' AND r.planned_on = ?");
      params.push(today);
    }
    if (status === 'overdue') {
      clauses.push("r.status = 'pending' AND r.planned_on < ?");
      params.push(today);
    }
    if (priority !== 'all') {
      clauses.push('r.priority = ?');
      params.push(priority);
    }
    if (from) {
      clauses.push('r.planned_on >= ?');
      params.push(from);
    }
    if (to) {
      clauses.push('r.planned_on <= ?');
      params.push(to);
    }
    const order =
      {
        date: "CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.planned_on ASC, r.id DESC",
        priority:
          "CASE r.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, r.planned_on ASC",
        recent: 'r.id DESC',
      }[sort] || 'r.planned_on ASC';
    return this.db.getAllAsync(
      `SELECT r.*, d.name AS subject_name, d.color AS subject_color FROM revisions r JOIN subjects d ON d.id = r.subject_id WHERE ${clauses.join(' AND ')} ORDER BY ${order}`,
      ...params,
    );
  }
  async save({ id, subject_id, title, planned_on, planned_minutes, priority, notes }) {
    if (id)
      return exists(
        await this.db.runAsync(
          'UPDATE revisions SET subject_id = ?, title = ?, planned_on = ?, planned_minutes = ?, priority = ?, notes = ? WHERE id = ?',
          subject_id,
          title,
          planned_on,
          planned_minutes,
          priority,
          notes,
          id,
        ),
      );
    return this.db.runAsync(
      'INSERT INTO revisions (subject_id, title, planned_on, planned_minutes, priority, notes) VALUES (?, ?, ?, ?, ?, ?)',
      subject_id,
      title,
      planned_on,
      planned_minutes,
      priority,
      notes,
    );
  }
  async complete(id, sessionId, today) {
    return exists(
      await this.db.runAsync(
        "UPDATE revisions SET status = 'done', completed_on = ?, session_id = ? WHERE id = ? AND status = 'pending'",
        today,
        sessionId,
        id,
      ),
    );
  }
  async delete(id) {
    return exists(await this.db.runAsync('DELETE FROM revisions WHERE id = ?', id));
  }
  async summary(today) {
    return this.db.getFirstAsync(
      "SELECT COUNT(*) AS total, COALESCE(SUM(status = 'done'),0) AS done, COALESCE(SUM(status = 'pending' AND planned_on = ?),0) AS today, COALESCE(SUM(status = 'pending' AND planned_on < ?),0) AS overdue FROM revisions",
      today,
      today,
    );
  }
}

export class FocusRepository {
  constructor(db) {
    this.db = db;
  }
  async current() {
    return this.db.getFirstAsync(
      'SELECT f.*, d.name AS subject_name, d.color AS subject_color FROM focus_timer f JOIN subjects d ON d.id = f.subject_id WHERE f.id = 1',
    );
  }
  async create({ subject_id, topic, target_minutes, accumulated_seconds, started_at_ms, status }) {
    return this.db.runAsync(
      'INSERT INTO focus_timer (id, subject_id, topic, target_minutes, accumulated_seconds, started_at_ms, status) VALUES (1, ?, ?, ?, ?, ?, ?)',
      subject_id,
      topic,
      target_minutes,
      accumulated_seconds,
      started_at_ms,
      status,
    );
  }
  async update({ accumulated_seconds, started_at_ms, status }) {
    return exists(
      await this.db.runAsync(
        'UPDATE focus_timer SET accumulated_seconds = ?, started_at_ms = ?, status = ? WHERE id = 1',
        accumulated_seconds,
        started_at_ms,
        status,
      ),
    );
  }
  async clear() {
    return exists(await this.db.runAsync('DELETE FROM focus_timer WHERE id = 1'));
  }
}
