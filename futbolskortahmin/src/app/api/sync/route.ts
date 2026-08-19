import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncFixtures, syncMatchEvents, syncPlayers } from '@/lib/api-football/sync';
import { BIG_FOUR_API_IDS, CURRENT_SEASON } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return Response.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, fixtureId, teamId } = body;

    switch (action) {
      case 'fixtures': {
        const result = await syncFixtures(CURRENT_SEASON);
        return Response.json({ success: true, ...result });
      }
      case 'events': {
        if (!fixtureId) return Response.json({ error: 'fixtureId gerekli' }, { status: 400 });
        const result = await syncMatchEvents(fixtureId);
        return Response.json({ success: true, ...result });
      }
      case 'players': {
        if (teamId) {
          const count = await syncPlayers(teamId, CURRENT_SEASON);
          return Response.json({ success: true, count });
        }
        // Sync all big four
        let total = 0;
        for (const id of BIG_FOUR_API_IDS) {
          total += await syncPlayers(id, CURRENT_SEASON);
        }
        return Response.json({ success: true, count: total });
      }
      default:
        return Response.json({ error: 'Geçersiz action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Senkronizasyon hatası' }, { status: 500 });
  }
}
