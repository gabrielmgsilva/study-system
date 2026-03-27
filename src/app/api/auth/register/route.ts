import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { setAuthCookie, signJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  const { email, name, password } = await req.json().catch(() => ({}));

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedName = String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedName || !normalizedPassword) {
    return NextResponse.json(
      { message: 'Name, email, and password are required.' },
      { status: 400 },
    );
  }

  if (normalizedName.length < 2) {
    return NextResponse.json(
      { message: 'Enter your full name.' },
      { status: 400 },
    );
  }

  if (normalizedPassword.length < 8) {
    return NextResponse.json(
      { message: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(normalizedPassword);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: normalizedName,
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

  const cookieValue = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true, user: { id: user.id, role: user.role } });
  setAuthCookie(res, cookieValue);

  return res;
}
