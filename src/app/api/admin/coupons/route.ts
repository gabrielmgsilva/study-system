import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAdmin, isAuthError } from '@/lib/guards';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10));
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status') || 'all';

  const where: Record<string, unknown> = { deletedAt: null };

  if (q) {
    where.code = { contains: q, mode: 'insensitive' };
  }

  if (status === 'active') where.isActive = true;
  else if (status === 'inactive') where.isActive = false;

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.coupon.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.map((c) => ({
      id: c.id,
      code: c.code,
      stripeId: c.stripeId,
      percentOff: c.percentOff,
      annualOnly: c.annualOnly,
      maxRedemptions: c.maxRedemptions,
      timesRedeemed: c.timesRedeemed,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const { code, percentOff, annualOnly, maxRedemptions, expiresAt } = body as {
    code?: string;
    percentOff?: number;
    annualOnly?: boolean;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
  };

  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    return NextResponse.json({ message: 'Code is required (min 2 characters).' }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  if (!percentOff || percentOff < 1 || percentOff > 100) {
    return NextResponse.json({ message: 'percentOff must be between 1 and 100.' }, { status: 400 });
  }

  const existing = await prisma.coupon.findFirst({
    where: { code: normalizedCode, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json({ message: 'A coupon with this code already exists.' }, { status: 409 });
  }

  // Create in Stripe first
  const stripeCoupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name: normalizedCode,
    max_redemptions: maxRedemptions ?? undefined,
    redeem_by: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
  });

  const coupon = await prisma.coupon.create({
    data: {
      code: normalizedCode,
      stripeId: stripeCoupon.id,
      percentOff,
      annualOnly: annualOnly ?? true,
      maxRedemptions: maxRedemptions ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json({ ok: true, coupon: { id: coupon.id, code: coupon.code } }, { status: 201 });
}
