import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { getSessionHistory } from '@/lib/services/stats';

export async function GET(req: NextRequest) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get('cursor');
  const data = await getSessionHistory(
    session.userId,
    cursor ? Number(cursor) : undefined,
  );
  return NextResponse.json(data);
}
