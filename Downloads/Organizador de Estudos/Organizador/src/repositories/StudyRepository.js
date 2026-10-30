// Somente esta camada conhece SQL. Valores do usuário sempre usam parâmetros (?);
// trechos de ORDER BY são escolhidos em listas fechadas.
function textFilter(value) {
  return `%${String(value || '')
    .trim()
    .replace(/[\\%_]/g, '\\$&')}%`;
}

function mustExist(result) {
  if (!result.changes)
    throw new Error('O registro não existe mais. Atualize a tela e tente novamente.');
  return result;
}

export class SubjectRepository {
  constructor(db) {
    this.db = db;
  }

  async list({ search = '', sort = 'name' } = {}) {
    const order =
      {
        name: 's.name COLLATE NOCASE ASC',
        time: 'total_minutes DESC, s.name ASC',
        recent: 's.id DESC',
      }[sort] || 's.name COLLATE NOCASE ASC';
    return this.db.getAllAsync(
      `
      SELECT s.*, COUNT(st.id) AS session_count, COALESCE(SUM(st.minutes), 0) AS total_minutes
      FROM subjects s LEFT JOIN sessions st ON st.subject_id = s.id
      WHERE s.name LIKE ? ESCAPE '\\' OR s.description LIKE ? ESCAPE '\\'
      GROUP BY s.id ORDER BY ${order}`,
      textFilter(search),
      textFilter(search),
    );
  }

  async find(id) {
    return this.db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', id);
  }

  async findByName(name) {
    return this.db.getFirstAsync('SELECT * FROM subjects WHERE name = ? COLLATE NOCASE', name);
  }

  async save(record) {
    const { id, name, description, color } = record;
    if (id)
      return mustExist(
        await this.db.runAsync(
          'UPDATE subjects SET name = ?, description = ?, color = ? WHERE id = ?',
          name,
          description,
          color,
          id,
        ),
      );
    return this.db.runAsync(
      'INSERT INTO subjects (name, description, color) VALUES (?, ?, ?)',
      name,
      description,
      color,
    );
  }

  async references(id) {
    return this.db.getFirstAsync(
      `SELECT
      (SELECT COUNT(*) FROM sessions WHERE subject_id = ?) AS sessions,
      (SELECT COUNT(*) FROM goals WHERE subject_id = ?) AS goals`,
      id,
      id,
    );
  }

  async delete(id) {
    return mustExist(await this.db.runAsync('DELETE FROM subjects WHERE id = ?', id));
  }
}

export class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  async list({ search = '', subjectId = null, from = null, to = null, sort = 'recent' } = {}) {
    const where = ["(s.topic LIKE ? ESCAPE '\\' OR d.name LIKE ? ESCAPE '\\')"];
    const params = [textFilter(search), textFilter(search)];
    if (subjectId) {
      where.push('s.subject_id = ?');
      params.push(Number(subjectId));
    }
    if (from) {
      where.push('s.studied_on >= ?');
      params.push(from);
    }
    if (to) {
      where.push('s.studied_on <= ?');
      params.push(to);
    }
    const order =
      {
        recent: 's.studied_on DESC, s.id DESC',
        oldest: 's.studied_on ASC, s.id ASC',
        duration: 's.minutes DESC, s.studied_on DESC',
      }[sort] || 's.studied_on DESC, s.id DESC';
    return this.db.getAllAsync(
      `SELECT s.*, d.name AS subject_name, d.color AS subject_color
      FROM sessions s JOIN subjects d ON d.id = s.subject_id
      WHERE ${where.join(' AND ')} ORDER BY ${order}`,
      ...params,
    );
  }

  async save({ id, subject_id, topic, minutes, studied_on, notes }) {
    if (id)
      return mustExist(
        await this.db.runAsync(
          'UPDATE sessions SET subject_id = ?, topic = ?, minutes = ?, studied_on = ?, notes = ? WHERE id = ?',
          subject_id,
          topic,
          minutes,
          studied_on,
          notes,
          id,
        ),
      );
    return this.db.runAsync(
      'INSERT INTO sessions (subject_id, topic, minutes, studied_on, notes) VALUES (?, ?, ?, ?, ?)',
      subject_id,
      topic,
      minutes,
      studied_on,
      notes,
    );
  }

  async delete(id) {
    return mustExist(await this.db.runAsync('DELETE FROM sessions WHERE id = ?', id));
  }
}

export class GoalRepository {
  constructor(db) {
    this.db = db;
  }

  async list({ status = 'all', subjectId = null, sort = 'deadline', today } = {}) {
    const where = [];
    const params = [today, today];
    if (status !== 'all') {
      where.push('status = ?');
      params.push(status);
    }
    if (subjectId) {
      where.push('subject_id = ?');
      params.push(Number(subjectId));
    }
    const order =
      {
        deadline: 'end_on ASC, id DESC',
        progress: '(1.0 * studied_minutes / target_minutes) DESC, end_on ASC',
        recent: 'id DESC',
      }[sort] || 'end_on ASC, id DESC';
    return this.db.getAllAsync(
      `SELECT * FROM (
      SELECT g.*, d.name AS subject_name, d.color AS subject_color,
        COALESCE(SUM(s.minutes), 0) AS studied_minutes,
        CASE
          WHEN COALESCE(SUM(s.minutes), 0) >= g.target_minutes THEN 'completed'
          WHEN g.end_on < ? THEN 'overdue'
          WHEN g.start_on > ? THEN 'scheduled'
          ELSE 'active'
        END AS status
      FROM goals g LEFT JOIN subjects d ON d.id = g.subject_id
      LEFT JOIN sessions s ON (g.subject_id IS NULL OR s.subject_id = g.subject_id)
        AND s.studied_on BETWEEN g.start_on AND g.end_on
      GROUP BY g.id
    ) ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`,
      ...params,
    );
  }

  async save({ id, subject_id, title, target_minutes, start_on, end_on }) {
    if (id)
      return mustExist(
        await this.db.runAsync(
          'UPDATE goals SET subject_id = ?, title = ?, target_minutes = ?, start_on = ?, end_on = ? WHERE id = ?',
          subject_id,
          title,
          target_minutes,
          start_on,
          end_on,
          id,
        ),
      );
    return this.db.runAsync(
      'INSERT INTO goals (subject_id, title, target_minutes, start_on, end_on) VALUES (?, ?, ?, ?, ?)',
      subject_id,
      title,
      target_minutes,
      start_on,
      end_on,
    );
  }

  async delete(id) {
    return mustExist(await this.db.runAsync('DELETE FROM goals WHERE id = ?', id));
  }
}

export class IndicatorRepository {
  constructor(db) {
    this.db = db;
  }

  async summary({ today, weekStart }) {
    return this.db.getFirstAsync(
      `SELECT
      COALESCE(SUM(minutes), 0) AS total_minutes,
      COUNT(*) AS total_sessions,
      COALESCE(SUM(CASE WHEN studied_on BETWEEN ? AND ? THEN minutes ELSE 0 END), 0) AS week_minutes,
      COUNT(DISTINCT studied_on) AS study_days,
      (SELECT COUNT(*) FROM subjects) AS total_subjects
      FROM sessions`,
      weekStart,
      today,
    );
  }

  async days(from, to) {
    return this.db.getAllAsync(
      'SELECT studied_on, SUM(minutes) AS minutes FROM sessions WHERE studied_on BETWEEN ? AND ? GROUP BY studied_on ORDER BY studied_on ASC',
      from,
      to,
    );
  }

  async distribution() {
    return this.db.getAllAsync(`SELECT d.id, d.name, d.color, SUM(s.minutes) AS minutes
      FROM subjects d JOIN sessions s ON s.subject_id = d.id
      GROUP BY d.id ORDER BY minutes DESC, d.name ASC`);
  }

  async studyDates() {
    return this.db.getAllAsync('SELECT DISTINCT studied_on FROM sessions ORDER BY studied_on DESC');
  }
}
