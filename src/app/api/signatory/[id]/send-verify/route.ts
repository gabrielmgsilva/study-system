import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { addDays, generateRawToken, hashToken } from '@/lib/token';
import { sendEmailDev } from '@/lib/email-dev';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const { id } = await params;
  const signatoryId = Number(id);
  if (!Number.isInteger(signatoryId) || signatoryId <= 0) {
    return NextResponse.json({ error: 'Invalid signatory id' }, { status: 400 });
  }

  const signatory = await prisma.signatory.findFirst({
    where: { id: signatoryId, deletedAt: null },
  });
  if (!signatory) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const raw = generateRawToken();
  const tokenHash = hashToken(raw);

  const verify = await prisma.signatoryVerificationRequest.create({
    data: {
      signatoryId: signatory.id,
      tokenHash,
      expiresAt: addDays(7),
    },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/signatory/verify/${raw}`;

  await sendEmailDev(
    signatory.email,
    'AME ONE — Confirm Signatory Profile',
    url
  );

  await prisma.auditEvent.create({
    data: {
      logbookId: signatory.logbookId,
      actorType: 'APPLICANT',
      action: 'SIGNATORY_VERIFY_SENT',
      metaJson: JSON.stringify({ signatoryId: signatory.id, verifyRequestId: verify.id }),
    },
  });

  await prisma.signatory.update({
    where: { id: signatory.id },
    data: { status: 'pending' },
  });

  return NextResponse.json({ ok: true });
}
