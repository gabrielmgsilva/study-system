import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getResendClient } from '@/lib/resend';
import { hashToken } from '@/lib/token';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const signatoryId = Number(body.signatoryId);
  if (!Number.isInteger(signatoryId) || signatoryId <= 0) {
    return NextResponse.json({ error: 'Missing signatoryId' }, { status: 400 });
  }

  const signatory = await prisma.signatory.findFirst({ where: { id: signatoryId, deletedAt: null } });
  if (!signatory) return NextResponse.json({ error: 'Signatory not found' }, { status: 404 });

  const email = (signatory.email || '').trim();
  if (!email) return NextResponse.json({ error: 'Signatory email missing' }, { status: 400 });

  // gera token
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

  await prisma.signatoryVerificationRequest.create({
    data: {
      signatoryId: signatory.id,
      tokenHash,
      expiresAt,
    },
  });

  await prisma.signatory.update({
    where: { id: signatory.id },
    data: { status: 'pending' },
  });

  await prisma.auditEvent.create({
    data: {
      logbookId: signatory.logbookId,
      actorType: 'APPLICANT',
      action: 'SIGNATORY_VERIFY_SENT',
      metaJson: JSON.stringify({ signatoryId: signatory.id, slotNumber: signatory.slotNumber, email }),
    },
  });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/signatory/verify/${token}`;
  const from = process.env.RESEND_FROM || 'AME ONE <onboarding@resend.dev>';
  const resend = getResendClient();

  await resend.emails.send({
    from,
    to: email,
    subject: 'AME ONE — Signatory verification',
    html: `
      <p>Hello ${signatory.name || ''},</p>
      <p>Please verify your signatory profile and provide your signature for AME ONE.</p>
      <p><a href="${verifyUrl}">Open verification link</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
