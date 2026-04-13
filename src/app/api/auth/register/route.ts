import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { setAuthCookie, signJWT } from '@/lib/jwt';
import { stripe } from '@/lib/stripe';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { email, name, password, planId } = await req.json().catch(() => ({}));

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedName = String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const normalizedPassword = String(password ?? '');
  const parsedPlanId = typeof planId === 'number' ? planId : null;

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

  // Resolve selected plan and trial days
  let selectedPlanId: number | null = null;
  let trialDays = 7;
  if (parsedPlanId) {
    const plan = await prisma.plan.findFirst({
      where: { id: parsedPlanId, isActive: true, deletedAt: null },
      select: { id: true, trialDays: true },
    });
    if (plan) {
      selectedPlanId = plan.id;
      trialDays = plan.trialDays;
    }
  }

  const passwordHash = await hashPassword(normalizedPassword);

  const subscriptionExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: normalizedName,
      passwordHash,
      planId: selectedPlanId,
      subscriptionStatus: selectedPlanId ? 'trialing' : null,
      subscriptionExpiresAt: selectedPlanId ? subscriptionExpiresAt : null,
      licenseEntitlements: {
        create: { licenseId: 'regs', isActive: true },
      },
    },
  });

  // Create Stripe customer asynchronously — don't block registration
  try {
    const customer = await stripe.customers.create({
      email: normalizedEmail,
      name: normalizedName,
      metadata: { userId: String(user.id) },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  } catch {
    // Stripe customer creation failed — user can still use trial
    // Customer will be created lazily at checkout time if needed
  }

  const cookieValue = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true, user: { id: user.id, role: user.role } });
  setAuthCookie(res, cookieValue);

  return res;
}
