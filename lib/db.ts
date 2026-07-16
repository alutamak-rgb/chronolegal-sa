import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = '/tmp/chronolegal-cases.db';
let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Try loading existing database file
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if needed
  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_ref TEXT NOT NULL,
      claimant TEXT NOT NULL,
      attorney TEXT DEFAULT '',
      accident_date TEXT DEFAULT '',
      status TEXT DEFAULT 'PROCESSING',
      matrix_data TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getAllCases() {
  const d = await getDb();
  const results = d.exec('SELECT * FROM cases ORDER BY created_at DESC');
  if (!results.length) return [];
  return results[0].values.map((row: any[]) => ({
    id: row[0], caseRef: row[1], claimant: row[2], attorney: row[3],
    accidentDate: row[4], status: row[5], matrixData: row[6],
    createdAt: row[7], updatedAt: row[8],
  }));
}

export async function getCaseById(id: string) {
  const d = await getDb();
  const results = d.exec('SELECT * FROM cases WHERE id = ?', [id]);
  if (!results.length || !results[0].values.length) return null;
  const row = results[0].values[0];
  return { id: row[0], caseRef: row[1], claimant: row[2], attorney: row[3], accidentDate: row[4], status: row[5], matrixData: row[6], createdAt: row[7], updatedAt: row[8] };
}

export async function createCase(data: { caseRef: string; claimant: string; attorney?: string; accidentDate?: string; matrixData?: string; status?: string }) {
  const d = await getDb();
  const id = `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  d.run(
    'INSERT INTO cases (id, case_ref, claimant, attorney, accident_date, status, matrix_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, data.caseRef, data.claimant, data.attorney || '', data.accidentDate || '', data.status || 'COMPLETED', data.matrixData || '[]', now, now]
  );
  persist();
  return { id, caseRef: data.caseRef, claimant: data.claimant, status: data.status || 'COMPLETED', createdAt: now };
}

export async function updateCase(id: string, data: { status?: string; matrixData?: string }) {
  const d = await getDb();
  const now = new Date().toISOString();
  if (data.status) d.run('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?', [data.status, now, id]);
  if (data.matrixData) d.run('UPDATE cases SET matrix_data = ?, updated_at = ? WHERE id = ?', [data.matrixData, now, id]);
  persist();
}
