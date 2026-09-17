import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

let db: Database.Database | null = null;

export type PeriodInput = {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
};

function dataRoot() {
  const root = path.join(app.getPath('documents'), 'DOC-UNIDADES');
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'archivos'), { recursive: true });
  fs.mkdirSync(path.join(root, 'plantillas'), { recursive: true });
  fs.mkdirSync(path.join(root, 'exportaciones'), { recursive: true });
  fs.mkdirSync(path.join(root, 'respaldos'), { recursive: true });
  return root;
}

export function getDataRoot() {
  return dataRoot();
}

export function getDb() {
  if (db) return db;
  const dbPath = path.join(dataRoot(), 'data', 'doc-unidades.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS core_periodos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_key TEXT NOT NULL UNIQUE,
      start_month INTEGER NOT NULL,
      start_year INTEGER NOT NULL,
      end_month INTEGER NOT NULL,
      end_year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVO',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS template_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_template_scope
      ON template_overrides(unit_id, process_id, document_id, section_id, is_active);

    CREATE TABLE IF NOT EXISTS section_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period_id, unit_id, process_id, document_id, section_id),
      FOREIGN KEY(period_id) REFERENCES core_periodos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_section_context
      ON section_content(period_id, unit_id, process_id, document_id, section_id);

    CREATE TABLE IF NOT EXISTS matrix_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      matrix_id TEXT NOT NULL,
      row_key TEXT,
      row_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(period_id) REFERENCES core_periodos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_matrix_context
      ON matrix_rows(period_id, unit_id, process_id, document_id, matrix_id, id);
    CREATE INDEX IF NOT EXISTS idx_matrix_row_key
      ON matrix_rows(period_id, matrix_id, row_key);

    CREATE TABLE IF NOT EXISTS import_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      matrix_id TEXT NOT NULL,
      source_name TEXT,
      read_rows INTEGER NOT NULL DEFAULT 0,
      saved_rows INTEGER NOT NULL DEFAULT 0,
      rejected_rows INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(period_id) REFERENCES core_periodos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER,
      unit_id TEXT,
      process_id TEXT,
      document_id TEXT,
      section_id TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function makeKey(p: PeriodInput) {
  const sm = String(p.startMonth).padStart(2, '0');
  const em = String(p.endMonth).padStart(2, '0');
  return `${p.startYear}-${sm}_${p.endYear}-${em}`;
}

export function listPeriods() {
  return getDb().prepare(`SELECT * FROM core_periodos ORDER BY start_year DESC, start_month DESC`).all();
}

export function createPeriod(input: PeriodInput) {
  const key = makeKey(input);
  const existing = getDb().prepare(`SELECT * FROM core_periodos WHERE period_key = ?`).get(key);
  if (existing) return existing;
  if (input.endYear < input.startYear || (input.endYear === input.startYear && input.endMonth < input.startMonth)) {
    throw new Error('El fin del período no puede ser anterior al inicio.');
  }
  const info = getDb().prepare(`
    INSERT INTO core_periodos(period_key,start_month,start_year,end_month,end_year)
    VALUES(?,?,?,?,?)
  `).run(key, input.startMonth, input.startYear, input.endMonth, input.endYear);
  return getDb().prepare(`SELECT * FROM core_periodos WHERE id = ?`).get(info.lastInsertRowid);
}

export function getSectionContent(args: any) {
  return getDb().prepare(`
    SELECT content FROM section_content
    WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=? AND section_id=?
  `).get(args.periodId, args.unitId, args.processId, args.documentId, args.sectionId) as {content:string} | undefined;
}

export function saveSectionContent(args: any) {
  getDb().prepare(`
    INSERT INTO section_content(period_id,unit_id,process_id,document_id,section_id,content,updated_at)
    VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(period_id,unit_id,process_id,document_id,section_id)
    DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
  `).run(args.periodId,args.unitId,args.processId,args.documentId,args.sectionId,args.content ?? '');
  logHistory(args, 'SECTION_SAVE', args.sectionId);
  return true;
}

export function getActiveTemplate(args: any) {
  return getDb().prepare(`
    SELECT * FROM template_overrides
    WHERE unit_id=? AND process_id=? AND document_id=? AND section_id=? AND is_active=1
    ORDER BY version DESC LIMIT 1
  `).get(args.unitId,args.processId,args.documentId,args.sectionId);
}

export function saveTemplate(args: any) {
  const database = getDb();
  const tx = database.transaction(() => {
    const current = database.prepare(`
      SELECT COALESCE(MAX(version),0) AS maxv FROM template_overrides
      WHERE unit_id=? AND process_id=? AND document_id=? AND section_id=?
    `).get(args.unitId,args.processId,args.documentId,args.sectionId) as {maxv:number};
    database.prepare(`
      UPDATE template_overrides SET is_active=0
      WHERE unit_id=? AND process_id=? AND document_id=? AND section_id=?
    `).run(args.unitId,args.processId,args.documentId,args.sectionId);
    database.prepare(`
      INSERT INTO template_overrides(unit_id,process_id,document_id,section_id,content,version,is_active)
      VALUES(?,?,?,?,?,?,1)
    `).run(args.unitId,args.processId,args.documentId,args.sectionId,args.content,current.maxv + 1);
  });
  tx();
  logHistory(args, 'TEMPLATE_SAVE', args.sectionId);
  return true;
}

export function listMatrixRows(args: any) {
  const limit = Math.min(Math.max(Number(args.limit ?? 100), 1), 500);
  const afterId = Math.max(Number(args.afterId ?? 0), 0);
  const rows = getDb().prepare(`
    SELECT id,row_key,row_json,updated_at FROM matrix_rows
    WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=? AND matrix_id=? AND id>?
    ORDER BY id ASC LIMIT ?
  `).all(args.periodId,args.unitId,args.processId,args.documentId,args.matrixId,afterId,limit) as any[];
  return rows.map(r => ({...r, data: JSON.parse(r.row_json)}));
}

export function replaceMatrixRows(args: any) {
  const database = getDb();
  const rows: any[] = Array.isArray(args.rows) ? args.rows : [];
  const tx = database.transaction(() => {
    database.prepare(`DELETE FROM matrix_rows WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=? AND matrix_id=?`)
      .run(args.periodId,args.unitId,args.processId,args.documentId,args.matrixId);
    const insert = database.prepare(`
      INSERT INTO matrix_rows(period_id,unit_id,process_id,document_id,matrix_id,row_key,row_json)
      VALUES(?,?,?,?,?,?,?)
    `);
    for (const row of rows) {
      const rowKey = row.__rowKey ?? null;
      insert.run(args.periodId,args.unitId,args.processId,args.documentId,args.matrixId,rowKey,JSON.stringify(row));
    }
    database.prepare(`
      INSERT INTO import_log(period_id,unit_id,process_id,document_id,matrix_id,source_name,read_rows,saved_rows,rejected_rows)
      VALUES(?,?,?,?,?,?,?,?,?)
    `).run(args.periodId,args.unitId,args.processId,args.documentId,args.matrixId,args.sourceName ?? 'manual',rows.length,rows.length,0);
  });
  tx();
  logHistory(args, 'MATRIX_REPLACE', `${args.matrixId}: ${rows.length} filas`);
  return { saved: rows.length };
}

export function upsertMatrixRow(args: any) {
  const database = getDb();
  if (args.id) {
    database.prepare(`UPDATE matrix_rows SET row_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(JSON.stringify(args.row), args.id);
  } else {
    database.prepare(`
      INSERT INTO matrix_rows(period_id,unit_id,process_id,document_id,matrix_id,row_key,row_json)
      VALUES(?,?,?,?,?,?,?)
    `).run(args.periodId,args.unitId,args.processId,args.documentId,args.matrixId,args.row?.__rowKey ?? null,JSON.stringify(args.row ?? {}));
  }
  logHistory(args, 'MATRIX_ROW_SAVE', args.matrixId);
  return true;
}

export function deleteMatrixRow(id: number) {
  getDb().prepare(`DELETE FROM matrix_rows WHERE id=?`).run(id);
  return true;
}

export function logHistory(args:any, action:string, detail:string) {
  getDb().prepare(`
    INSERT INTO history_log(period_id,unit_id,process_id,document_id,section_id,action,detail)
    VALUES(?,?,?,?,?,?,?)
  `).run(args.periodId ?? null,args.unitId ?? null,args.processId ?? null,args.documentId ?? null,args.sectionId ?? null,action,detail);
}

export function getStats(args:any) {
  const count = getDb().prepare(`
    SELECT COUNT(*) AS c FROM matrix_rows WHERE period_id=? AND unit_id=? AND process_id=? AND document_id=?
  `).get(args.periodId,args.unitId,args.processId,args.documentId) as {c:number};
  return { rows: count.c };
}
