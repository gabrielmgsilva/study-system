import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/token';
import { NextResponse } from 'next/server';

function getIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { token, signatureSvg } = body;

  if (!token || !signatureSvg) {
    return NextResponse.json({ error: 'Missing token or signature' }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  const vr = await prisma.signatoryVerificationRequest.findFirst({
    where: { tokenHash, deletedAt: null, signatory: { deletedAt: null } },
    include: { signatory: true },
  });

  if (!vr) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  if (vr.usedAt) return NextResponse.json({ error: 'Link already used' }, { status: 400 });
  if (vr.expiresAt < new Date()) return NextResponse.json({ error: 'Link expired' }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.signatory.update({
      where: { id: vr.signatoryId },
      data: {
        signatureSvg,
        signatureUpdatedAt: new Date(),
        status: 'verified',
      },
    });

    await tx.signatoryVerificationRequest.update({
      where: { id: vr.id },
      data: { usedAt: new Date() },
    });

    await tx.auditEvent.create({
      data: {
        logbookId: vr.signatory.logbookId,
        actorType: 'SIGNATORY',
        actorId: vr.signatoryId,
        action: 'SIGNATORY_VERIFIED',
        metaJson: JSON.stringify({ signatoryId: vr.signatoryId }),
        ip: getIp(req),
        userAgent: req.headers.get('user-agent'),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
