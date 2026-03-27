import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  const logbook = await prisma.logbook.create({
    data: {},
  });

  return NextResponse.json({ logbookId: String(logbook.id) });
}
