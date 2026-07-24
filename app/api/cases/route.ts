import { NextRequest, NextResponse } from 'next/server';
import { getAllCases, createCase, getCaseById, cleanupOrphanCases } from '@/lib/db';

// Run cleanup on first request to remove legacy/mock cases without userId
let cleaned = false;

export async function GET(req: NextRequest) {
  try {
    if (!cleaned) { await cleanupOrphanCases(); cleaned = true; }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId') || undefined;
    
    if (id) {
      const c = await getCaseById(id, userId);
      if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      return NextResponse.json({ success: true, case: c });
    }
    const cases = await getAllCases(userId);
    return NextResponse.json({ success: true, cases });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve cases.', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseRef, claimant, attorney, accidentDate, matrixData, status, userId } = body;
    if (!caseRef || !claimant) return NextResponse.json({ error: 'Case Reference and Claimant are required.' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const result = await createCase({ caseRef, claimant, attorney, accidentDate, matrixData: JSON.stringify(matrixData || []), status, userId });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save case.', details: error.message }, { status: 500 });
  }
}
