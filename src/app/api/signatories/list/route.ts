import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const logbookId = Number(searchParams.get('logbookId'));

  if (!Number.isInteger(logbookId) || logbookId <= 0) {
    return NextResponse.json({ error: 'Missing logbookId' }, { status: 400 });
  }

  const rows = await prisma.signatory.findMany({
    where: { logbookId, deletedAt: null },
    orderBy: { slotNumber: 'asc' },
  });

  return NextResponse.json({ signatories: rows.map((row) => ({ ...row, id: String(row.id), logbookId: String(row.logbookId) })) });
}
