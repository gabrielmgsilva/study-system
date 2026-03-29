import { NextResponse } from 'next/server';

import { getPublicPlans } from '@/lib/publicPlans';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await getPublicPlans();

  return NextResponse.json({
    ok: true,
    items,
  });
}