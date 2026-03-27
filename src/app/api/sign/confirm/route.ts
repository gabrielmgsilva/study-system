import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/token';
import { NextResponse } from 'next/server';

function getIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const tokenHash = hashToken(token);

  const r = await prisma.taskSignatureRequest.findFirst({
    where: { tokenHash, deletedAt: null, signatory: { deletedAt: null }, logbook: { deletedAt: null } },
    include: { signatory: true },
  });

  if (!r) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  if (r.usedAt) return NextResponse.json({ error: 'Link already used' }, { status: 400 });
  if (r.expiresAt < new Date()) return NextResponse.json({ error: 'Link expired' }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.taskSignatureRequest.update({
      where: { id: r.id },
      data: { usedAt: new Date() },
    });

    await tx.auditEvent.create({
      data: {
        logbookId: r.logbookId,
        actorType: 'SIGNATORY',
        actorId: r.signatoryId,
        action: 'TASKS_SIGNED',
        metaJson: r.payloadJson,
        ip: getIp(req),
        userAgent: req.headers.get('user-agent'),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
