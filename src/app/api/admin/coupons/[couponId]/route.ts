import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAdmin, isAuthError } from '@/lib/guards';

type RouteParams = { params: Promise<{ couponId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { couponId } = await params;
  const id = Number(couponId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: 'Invalid coupon ID.' }, { status: 400 });
  }

  const coupon = await prisma.coupon.findFirst({ where: { id, deletedAt: null } });
  if (!coupon) {
    return NextResponse.json({ message: 'Coupon not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { isActive, maxRedemptions, expiresAt } = body as {
    isActive?: boolean;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (typeof isActive === 'boolean') data.isActive = isActive;
  if (maxRedemptions !== undefined) data.maxRedemptions = maxRedemptions;
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: 'No fields to update.' }, { status: 400 });
  }

  await prisma.coupon.update({ where: { id }, data });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { couponId } = await params;
  const id = Number(couponId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: 'Invalid coupon ID.' }, { status: 400 });
  }

  const coupon = await prisma.coupon.findFirst({ where: { id, deletedAt: null } });
  if (!coupon) {
    return NextResponse.json({ message: 'Coupon not found.' }, { status: 404 });
  }

  // Soft-delete locally
  await prisma.coupon.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  // Delete in Stripe (best-effort)
  try {
    await stripe.coupons.del(coupon.stripeId);
  } catch {
    // Stripe coupon may already be deleted
  }

  return NextResponse.json({ ok: true });
}
