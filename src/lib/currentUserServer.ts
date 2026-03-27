import 'server-only';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE_NAME, getUserIdFromToken, verifyJWT } from '@/lib/jwt';

export async function getCurrentSessionServer() {
  const raw = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const token = await verifyJWT(raw);

  if (!token) {
    return null;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  return {
    userId,
    email: token.email,
    role: token.role,
    expiresAt: token.exp ? new Date(token.exp * 1000) : null,
  };
}

export async function getCurrentUserServer() {
  const session = await getCurrentSessionServer();
  if (!session) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      username: true,
      primaryLicenseId: true,
      studyLevel: true,
      studyGoal: true,
      onboardingCompletedAt: true,
    },
  });
}