import fs from 'fs';
import path from 'path';

const DATA_DIR = '/data';
const DB_PATH = path.join(DATA_DIR, 'cases.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]');

function read(): any[] {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); } catch { return []; }
}

function write(rows: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(rows, null, 2));
}

export async function getAllCases(userId?: string) {
  const all = read();
  const filtered = userId ? all.filter(c => c.userId === userId) : all;
  return filtered.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCaseById(id: string, userId?: string) {
  const c = read().find(c => c.id === id) || null;
  if (c && userId && c.userId !== userId) return null;
  return c;
}

export async function createCase(data: {
  caseRef: string;
  claimant: string;
  attorney?: string;
  accidentDate?: string;
  matrixData?: string;
  status?: string;
  userId?: string;
}) {
  const rows = read();
  const now = new Date().toISOString();
  const entry = {
    id: `case_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    userId: data.userId || '',
    caseRef: data.caseRef,
    claimant: data.claimant,
    attorney: data.attorney || '',
    accidentDate: data.accidentDate || '',
    status: data.status || 'COMPLETED',
    matrixData: data.matrixData || '[]',
    createdAt: now,
    updatedAt: now,
  };
  rows.push(entry);
  write(rows);
  return entry;
}

export async function updateCase(id: string, userId: string, data: { status?: string; matrixData?: string }) {
  const rows = read();
  const idx = rows.findIndex(c => c.id === id && c.userId === userId);
  if (idx === -1) return null;
  if (data.status) rows[idx].status = data.status;
  if (data.matrixData) rows[idx].matrixData = data.matrixData;
  rows[idx].updatedAt = new Date().toISOString();
  write(rows);
  return rows[idx];
}

// Clean up any cases without userId (legacy/mock data)
export async function cleanupOrphanCases() {
  const rows = read();
  const filtered = rows.filter(c => c.userId && c.userId !== '');
  if (filtered.length !== rows.length) {
    write(filtered);
    console.log(`[DB] Cleaned up ${rows.length - filtered.length} orphan cases`);
  }
}
