import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { orderBy: { name: 'asc' } } } },
      awayTeam: { include: { players: { orderBy: { name: 'asc' } } } },
      goals: { include: { player: true, team: true } },
      assists: { include: { player: true, team: true } },
      motmPlayer: true,
    },
  });

  if (!match) {
    return Response.json({ error: 'Maç bulunamadı' }, { status: 404 });
  }

  const now = new Date();

  return Response.json({
    match: {
      ...match,
      kickoffTime: match.kickoffTime.toISOString(),
      isLocked: now >= match.kickoffTime,
    },
  });
}
