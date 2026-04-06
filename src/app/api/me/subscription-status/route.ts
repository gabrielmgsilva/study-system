import { NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/guards';
import { getSubscriptionStatus } from '@/lib/subscriptionGuard';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const status = await getSubscriptionStatus(auth.userId);

  return NextResponse.json(status);
}
