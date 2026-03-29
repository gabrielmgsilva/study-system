import type { Prisma, UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

const USER_ROLES = ['user', 'admin'] as const satisfies readonly UserRole[];

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, 50);
}

function parseStatus(value: string | null) {
  if (!value) return 'active';
  return ['all', 'active', 'inactive'].includes(value) ? value : 'active';
}

function parseRole(value: string | null): UserRole | null {
  if (!value) return null;
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : null;
}

function normalizeSearch(value: string | null) {
  return String(value ?? '').trim();
}

function parseActivityStatus(value: string | null) {
  if (!value) return null;
  return ['all', 'active', 'inactive', 'onboarding'].includes(value) ? value : null;
}

function parseLastLoginWindow(value: string | null) {
  if (!value) return null;
  return ['any', '24h', '7d', '30d', 'over30d'].includes(value) ? value : null;
}

function getLastLoginWhere(window: string | null): Prisma.UserWhereInput {
  const now = Date.now();

  if (window === '24h') return { updatedAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } };
  if (window === '7d') return { updatedAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
  if (window === '30d') return { updatedAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
  if (window === 'over30d') return { updatedAt: { lt: new Date(now - 30 * 24 * 60 * 60 * 1000) } };

  return {};
}

function getActivityWhere(activityStatus: string | null): Prisma.UserWhereInput {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (activityStatus === 'active') {
    return {
      onboardingCompletedAt: { not: null },
      updatedAt: { gte: cutoff },
    };
  }

  if (activityStatus === 'inactive') {
    return {
      onboardingCompletedAt: { not: null },
      updatedAt: { lt: cutoff },
    };
  }

  if (activityStatus === 'onboarding') {
    return {
      onboardingCompletedAt: null,
    };
  }

  return {};
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const search = normalizeSearch(req.nextUrl.searchParams.get('q'));
  const status = parseStatus(req.nextUrl.searchParams.get('status'));
  const role = parseRole(req.nextUrl.searchParams.get('role'));
  const planTier = req.nextUrl.searchParams.get('planTier');
  const primaryLicenseId = String(req.nextUrl.searchParams.get('primaryLicenseId') ?? '').trim().toLowerCase();
  const activityStatus = parseActivityStatus(req.nextUrl.searchParams.get('activityStatus'));
  const lastLoginWindow = parseLastLoginWindow(req.nextUrl.searchParams.get('lastLoginWindow'));
  const subscriptionFilter = req.nextUrl.searchParams.get('subscription') || 'all';
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get('pageSize'));

  const where: Prisma.UserWhereInput = {
    ...(status === 'active' ? { deletedAt: null } : {}),
    ...(status === 'inactive' ? { deletedAt: { not: null } } : {}),
    ...(role ? { role } : {}),
    ...(planTier && planTier !== 'all'
      ? {
          plan: {
            is: {
              deletedAt: null,
              slug: planTier,
            },
          },
        }
      : {}),
    ...(primaryLicenseId && primaryLicenseId !== 'all' ? { primaryLicenseId } : {}),
    ...(subscriptionFilter !== 'all' ? { subscriptionStatus: subscriptionFilter === 'none' ? null : subscriptionFilter } : {}),
    ...getActivityWhere(activityStatus),
    ...getLastLoginWhere(lastLoginWindow),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        deletedAt: true,
        role: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        stripeCustomerId: true,
        primaryLicenseId: true,
        studyLevel: true,
        studyGoal: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
        creditAccount: {
          select: {
            balance: true,
          },
        },
        plan: {
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
          },
        },
        licenseEntitlements: {
          where: { deletedAt: null, isActive: true },
          orderBy: { licenseId: 'asc' },
          select: {
            licenseId: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    items: users.map((user) => ({
      ...user,
      status: user.deletedAt ? 'inactive' : 'active',
      creditBalance: user.creditAccount?.balance ?? 0,
      subscriptionStatus: user.subscriptionStatus ?? null,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      stripeCustomerId: user.stripeCustomerId ?? null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}
