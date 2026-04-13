import { NextResponse } from 'next/server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { email } = await req.json().catch(() => ({}));
  const normalizedEmail = String(email || '').trim().toLowerCase();

  // Always return success (avoid account enumeration)
  if (!normalizedEmail) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const resetUrl = `${baseUrl || ''}/auth/reset-password?token=${token}`;

  // If RESEND is configured, send email (production-ready), otherwise fall back to dev link.
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'AME ONE <no-reply@ameone.app>';
  if (resendKey && baseUrl) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to: normalizedEmail,
        subject: 'Reset your AME ONE password',
        html: `
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a> (valid for 30 minutes).</p>
          <p>If you didn’t request this, you can ignore this email.</p>
        `,
      });
    } catch (e) {
      // Don’t block user flow if mail fails.
    }
  }

  // DEV behavior: return the link so you can test without email.
  // Production: wire a mail provider and remove this.
  const includeLink = process.env.NODE_ENV !== 'production' || !resendKey || !baseUrl;
  return NextResponse.json({ ok: true, ...(includeLink ? { resetUrl } : {}) });
}
