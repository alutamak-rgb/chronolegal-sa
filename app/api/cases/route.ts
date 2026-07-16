import { NextRequest, NextResponse } from 'next/server';
import { getAllCases, createCase, getCaseById } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const c = await getCaseById(id);
      if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      return NextResponse.json({ success: true, case: c });
    }
    const cases = await getAllCases();
    return NextResponse.json({ success: true, cases });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve cases.', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseRef, claimant, attorney, accidentDate, matrixData, status } = body;
    if (!caseRef || !claimant) return NextResponse.json({ error: 'Case Reference and Claimant are required.' }, { status: 400 });
    const result = await createCase({ caseRef, claimant, attorney, accidentDate, matrixData: JSON.stringify(matrixData || []), status });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save case.', details: error.message }, { status: 500 });
  }
}
