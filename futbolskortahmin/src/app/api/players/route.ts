import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');
  const teamIds = request.nextUrl.searchParams.get('teamIds');
  
  if (!teamId && !teamIds) {
    return Response.json({ error: 'teamId veya teamIds gerekli' }, { status: 400 });
  }

  const whereClause = teamIds 
    ? { teamId: { in: teamIds.split(',') } }
    : { teamId: teamId! };

  const players = await prisma.player.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      position: true,
      teamId: true,
      apiFootballId: true,
      team: { select: { shortName: true } }
    },
  });

  return Response.json({ players });
}
