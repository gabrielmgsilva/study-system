import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { logbookId, name, email, licenceOrAuthNo, initials } = body;
  const parsedLogbookId = Number(logbookId);

  if (!Number.isInteger(parsedLogbookId) || parsedLogbookId <= 0 || !name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const signatory = await prisma.signatory.create({
    data: {
      logbookId: parsedLogbookId,
      name,
      email,
      licenceOrAuthNo: licenceOrAuthNo ?? null,
      initials: initials ?? null,
      status: 'draft',
    },
  });

  await prisma.auditEvent.create({
    data: {
      logbookId,
      actorType: 'APPLICANT',
      action: 'SIGNATORY_CREATED',
      metaJson: JSON.stringify({ signatoryId: signatory.id }),
    },
  });

  return NextResponse.json({ signatory: { ...signatory, id: String(signatory.id), logbookId: String(signatory.logbookId) } });
}
