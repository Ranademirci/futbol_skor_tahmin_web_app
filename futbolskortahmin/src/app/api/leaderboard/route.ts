import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { CURRENT_SEASON } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'season'; // match, weekly, season
  const matchId = searchParams.get('matchId');
  const week = searchParams.get('week');
  const season = searchParams.get('season') || String(CURRENT_SEASON);

  let where: Record<string, unknown> = {};

  if (type === 'match' && matchId) {
    where = { matchId };
  } else if (type === 'weekly' && week) {
    where = { match: { week: parseInt(week, 10), season } };
  } else {
    // season
    where = { match: { season } };
  }

  const scores = await prisma.userScore.groupBy({
    by: ['userId'],
    where: where as any,
    _sum: { totalPoints: true },
    _count: { matchId: true },
    orderBy: { _sum: { totalPoints: 'desc' } },
  });

  // Get user details
  const userIds = scores.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, firstName: true, lastName: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const leaderboard = scores.map((s, index) => {
    const user = userMap.get(s.userId);
    return {
      userId: s.userId,
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      totalPoints: s._sum.totalPoints || 0,
      matchCount: s._count.matchId,
      rank: index + 1,
    };
  });

  return Response.json({ leaderboard, type });
}
