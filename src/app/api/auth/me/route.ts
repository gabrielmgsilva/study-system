import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignedSession } from '@/lib/auth';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/ameone_session=([^;]+)/);
  const raw = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  const sessionId = verifySignedSession(raw);
  if (!sessionId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (session.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, userId: session.userId });
}
