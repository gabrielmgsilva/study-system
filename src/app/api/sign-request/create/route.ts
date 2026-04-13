import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { addDays, generateRawToken, hashToken } from '@/lib/token';
import { sendEmailDev } from '@/lib/email-dev';
import { requireAuth, isAuthError } from '@/lib/guards';

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { logbookId, signatoryId, tasks } = body;
  const parsedLogbookId = Number(logbookId);
  const parsedSignatoryId = Number(signatoryId);

  if (
    !Number.isInteger(parsedLogbookId) ||
    parsedLogbookId <= 0 ||
    !Number.isInteger(parsedSignatoryId) ||
    parsedSignatoryId <= 0 ||
    !Array.isArray(tasks) ||
    tasks.length === 0
  ) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const logbook = await prisma.logbook.findFirst({ where: { id: parsedLogbookId }, select: { userId: true } });
  if (!logbook) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (logbook.userId !== null && logbook.userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const signatory = await prisma.signatory.findFirst({
    where: { id: parsedSignatoryId, logbookId: parsedLogbookId, deletedAt: null },
  });
  if (!signatory) return NextResponse.json({ error: 'Signatory not found' }, { status: 404 });

  if (signatory.status !== 'verified' || !signatory.signatureSvg) {
    return NextResponse.json(
      { error: 'Signatory must be VERIFIED and have a saved signature' },
      { status: 400 }
    );
  }

  const raw = generateRawToken();
  const tokenHash = hashToken(raw);

  const reqRecord = await prisma.taskSignatureRequest.create({
    data: {
      logbookId: parsedLogbookId,
      signatoryId: parsedSignatoryId,
      tokenHash,
      expiresAt: addDays(7),
      payloadJson: JSON.stringify({ tasks }),
    },
  });

  const url =
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sign/${raw}`;

  await sendEmailDev(signatory.email, 'AME ONE — Signature request', url);

  await prisma.auditEvent.create({
    data: {
      logbookId,
      actorType: 'APPLICANT',
      action: 'TASK_SIGNATURE_REQUEST_SENT',
      metaJson: JSON.stringify({
        taskSignatureRequestId: reqRecord.id,
        signatoryId: parsedSignatoryId,
        taskCount: tasks.length,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
