import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { name, email, licenceOrAuthNo, initials } = body;
  const { id } = await params;
  const signatoryId = Number(id);

  if (!Number.isInteger(signatoryId) || signatoryId <= 0) {
    return NextResponse.json({ error: 'Invalid signatory id' }, { status: 400 });
  }

  const existing = await prisma.signatory.findFirst({ where: { id: signatoryId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const signatory = await prisma.signatory.update({
    where: { id: signatoryId },
    data: {
      name: name ?? existing.name,
      email: email ?? existing.email,
      licenceOrAuthNo: licenceOrAuthNo ?? existing.licenceOrAuthNo,
      initials: initials ?? existing.initials,
      status: 'needs_reverify',
    },
  });

  await prisma.auditEvent.create({
    data: {
      logbookId: existing.logbookId,
      actorType: 'APPLICANT',
      action: 'SIGNATORY_UPDATED_NEEDS_REVERIFY',
      metaJson: JSON.stringify({ signatoryId: signatory.id }),
    },
  });

  return NextResponse.json({ signatory: { ...signatory, id: String(signatory.id), logbookId: String(signatory.logbookId) } });
}
