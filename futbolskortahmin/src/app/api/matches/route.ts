import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { CURRENT_SEASON } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const week = searchParams.get('week');
  const season = searchParams.get('season') || String(CURRENT_SEASON);

  const where: Record<string, unknown> = {
    season,
    OR: [
      { homeTeam: { isBigFour: true } },
      { awayTeam: { isBigFour: true } },
    ],
  };

  if (week) {
    where.week = parseInt(week, 10);
  }

  const matches = await prisma.match.findMany({
    where: where as any,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickoffTime: 'asc' },
  });

  const now = new Date();
  const result = matches.map((m) => ({
    id: m.id,
    season: m.season,
    week: m.week,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      shortName: m.homeTeam.shortName,
      logoUrl: m.homeTeam.logoUrl,
      apiFootballId: m.homeTeam.apiFootballId,
      isBigFour: m.homeTeam.isBigFour,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      shortName: m.awayTeam.shortName,
      logoUrl: m.awayTeam.logoUrl,
      apiFootballId: m.awayTeam.apiFootballId,
      isBigFour: m.awayTeam.isBigFour,
    },
    kickoffTime: m.kickoffTime.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    isDerby: m.isDerby,
    status: m.status,
    isLocked: now >= m.kickoffTime,
  }));

  return Response.json({ matches: result });
}
