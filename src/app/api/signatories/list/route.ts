import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/guards';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const logbookId = Number(searchParams.get('logbookId'));

  if (!Number.isInteger(logbookId) || logbookId <= 0) {
    return NextResponse.json({ error: 'Missing logbookId' }, { status: 400 });
  }

  const logbook = await prisma.logbook.findFirst({ where: { id: logbookId }, select: { userId: true } });
  if (!logbook) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (logbook.userId !== null && logbook.userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.signatory.findMany({
    where: { logbookId, deletedAt: null },
    orderBy: { slotNumber: 'asc' },
  });

  return NextResponse.json({ signatories: rows.map((row) => ({ ...row, id: String(row.id), logbookId: String(row.logbookId) })) });
}
