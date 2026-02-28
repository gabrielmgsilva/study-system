import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signSessionId } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, username, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 },
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = username ? String(username).trim() : null;

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(String(password));

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      creditAccount: { create: { balance: 10 } },
      creditLedger: { create: { delta: 10, reason: 'Welcome credits' } },
      // Default plan experience (does NOT unlock any modules by itself)
      licenseEntitlements: {
        createMany: {
          data: [
            { licenseId: 'regs', plan: 'basic' },
            { licenseId: 'm', plan: 'basic' },
            { licenseId: 'e', plan: 'basic' },
            { licenseId: 's', plan: 'basic' },
            { licenseId: 'balloons', plan: 'basic' },
          ],
        },
      },
    },
  });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12); // 12h
  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt },
  });

  const cookieValue = signSessionId(session.id);
  const res = NextResponse.json({ ok: true });

  res.cookies.set('ameone_session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return res;
}
