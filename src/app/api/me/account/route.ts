import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/guards';

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ message: 'Confirmation text does not match.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { deletedAt: new Date() },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('ameone_token', '', { maxAge: 0, path: '/' });
  return res;
}
