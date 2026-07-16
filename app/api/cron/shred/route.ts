import { NextRequest, NextResponse } from 'next/server';
import { getAllCases } from '@/lib/db';
import { shredCaseDocuments } from '@/lib/popia';

/**
 * Cron endpoint — call every hour to shred expired files.
 * Files uploaded >24 hours ago get overwritten and deleted.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = process.env.CRON_SECRET || 'chronolegal-cron-secret';
  if (authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log(`🤖 [Compliance Worker]: Scanning for cases before ${twentyFourHoursAgo.toISOString()}`);

    const allCases = await getAllCases();

    // Find cases older than 24 hours that haven't been shredded
    const expiredCases = allCases.filter(c =>
      c.createdAt <= twentyFourHoursAgo.toISOString() && c.status !== 'SHREDDED'
    );

    if (expiredCases.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired cases to shred.' });
    }

    const results = [];
    for (const c of expiredCases) {
      try {
        const result = await shredCaseDocuments(c.id);
        results.push(result);
      } catch (err: any) {
        results.push({ caseId: c.id, error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });

  } catch (error: any) {
    console.error('❌ [Compliance Cron Failed]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
