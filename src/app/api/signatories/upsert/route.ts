import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const logbookId = Number(body.logbookId);
  const slotNumber = Number(body.slotNumber);

  if (!Number.isInteger(logbookId) || logbookId <= 0 || !Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 15) {
    return NextResponse.json({ error: 'Missing/invalid logbookId or slotNumber' }, { status: 400 });
  }

  const data = {
    name: String(body.name || ''),
    email: String(body.email || ''),
    licenceOrAuthNo: String(body.licenceNumber || body.licenceOrAuthNo || ''),
    initials: String(body.initials || ''),
  };

  const signatory = await prisma.signatory.upsert({
    where: { logbookId_slotNumber: { logbookId, slotNumber } },
    update: data,
    create: {
      logbookId,
      slotNumber,
      ...data,
      status: 'draft',
      signatureSvg: null,
    },
  });

  return NextResponse.json({ signatory: { ...signatory, id: String(signatory.id), logbookId: String(signatory.logbookId) } });
}
