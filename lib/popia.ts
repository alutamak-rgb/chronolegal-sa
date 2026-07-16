import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAllCases, updateCase } from './db';

const UPLOADS_DIR = '/data/uploads';

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export interface ShreddingResult {
  caseId: string;
  filesPurged: string[];
  auditedAt: string;
  success: boolean;
}

/**
 * Structural shredder — overwrites uploaded medical PDFs with random noise
 * then permanently deletes them. Satisfies POPIA data-minimization rules.
 * Files stored locally on Railway volume (/data/uploads) — no cloud costs.
 */
export async function shredCaseDocuments(caseId: string): Promise<ShreddingResult> {
  const caseDir = path.join(UPLOADS_DIR, caseId);
  const purgedFiles: string[] = [];

  try {
    // Find the case in our store
    const allCases = await getAllCases();
    const caseData = allCases.find(c => c.id === caseId);
    if (!caseData) throw new Error(`Case ${caseId} not found in registry.`);

    // Check if uploads directory exists for this case
    if (fs.existsSync(caseDir)) {
      const files = fs.readdirSync(caseDir);

      for (const fileName of files) {
        const filePath = path.join(caseDir, fileName);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          console.log(`🔒 [POPIA Shredder]: Overwriting ${fileName}...`);

          // Step 1: Overwrite with random noise (3 passes)
          for (let pass = 0; pass < 3; pass++) {
            const noise = crypto.randomBytes(Math.min(stat.size, 1024 * 100));
            fs.writeFileSync(filePath, noise);
          }

          // Step 2: Delete the file
          fs.unlinkSync(filePath);
          purgedFiles.push(fileName);
        }
      }

      // Step 3: Remove the case directory if empty
      const remaining = fs.readdirSync(caseDir);
      if (remaining.length === 0) fs.rmdirSync(caseDir);
    }

    // Step 4: Update case record to mark as shredded
    await updateCase(caseId, { status: 'SHREDDED' });

    // Step 5: Write audit entry
    const auditDir = '/data';
    const auditPath = path.join(auditDir, 'popia_audit.json');
    let auditTrail: any[] = [];
    if (fs.existsSync(auditPath)) {
      try { auditTrail = JSON.parse(fs.readFileSync(auditPath, 'utf-8')); } catch {}
    }
    auditTrail.push({
      caseId, caseRef: caseData.caseRef, action: 'STRUCTURAL_SHRED',
      executedAt: new Date().toISOString(), purgedFiles,
    });
    fs.writeFileSync(auditPath, JSON.stringify(auditTrail, null, 2));

    return { caseId, filesPurged: purgedFiles, auditedAt: new Date().toISOString(), success: true };

  } catch (error: any) {
    console.error(`❌ [POPIA Failure] Case ${caseId}:`, error);
    throw new Error(`Shredding failed: ${error.message}`);
  }
}

/**
 * Saves an uploaded file buffer to the case upload directory.
 * Returns the relative path for later shredding.
 */
export async function saveUploadedFile(caseId: string, fileName: string, buffer: Buffer): Promise<string> {
  const caseDir = path.join(UPLOADS_DIR, caseId);
  if (!fs.existsSync(caseDir)) fs.mkdirSync(caseDir, { recursive: true });
  const filePath = path.join(caseDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}
