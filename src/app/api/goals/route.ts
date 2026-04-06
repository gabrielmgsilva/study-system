import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { createGoal, deleteGoal } from '@/lib/services/goals';

export async function POST(req: NextRequest) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, targetType, targetValue, targetDate } = body as {
    title?: string;
    targetType?: string;
    targetValue?: number;
    targetDate?: string;
  };

  if (!title || !targetType || targetValue === undefined) {
    return NextResponse.json(
      { error: 'title, targetType, and targetValue are required.' },
      { status: 400 },
    );
  }

  const goal = await createGoal(session.userId, {
    title,
    targetType,
    targetValue,
    targetDate: targetDate ? new Date(targetDate) : undefined,
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { goalId } = body as { goalId?: number };

  if (!goalId) {
    return NextResponse.json(
      { error: 'goalId is required.' },
      { status: 400 },
    );
  }

  await deleteGoal(goalId, session.userId);
  return NextResponse.json({ ok: true });
}
