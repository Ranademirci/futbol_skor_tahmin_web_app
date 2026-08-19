import prisma from '../prisma';
import { apiFootballFetch } from './client';
import { BIG_FOUR_API_IDS, SUPER_LIG_ID, MATCH_STATUS } from '../constants';
import type { ApiFixture, ApiFixtureEvent, ApiPlayer } from './types';

// Map API-Football status to our status
function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'NS': return MATCH_STATUS.SCHEDULED;
    case 'TBD': return MATCH_STATUS.SCHEDULED;
    case '1H': case '2H': case 'HT': case 'ET': case 'BT': case 'P': case 'SUSP': case 'INT': case 'LIVE':
      return MATCH_STATUS.LIVE;
    case 'FT': case 'AET': case 'PEN':
      return MATCH_STATUS.FINISHED;
    case 'PST': return MATCH_STATUS.POSTPONED;
    case 'CANC': case 'ABD': case 'AWD': case 'WO':
      return MATCH_STATUS.CANCELLED;
    default: return MATCH_STATUS.SCHEDULED;
  }
}

// Extract week number from round string like "Regular Season - 5"
function extractWeek(round: string): number {
  const match = round.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function syncFixtures(season: number): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  const fixtures = await apiFootballFetch<ApiFixture>('fixtures', {
    league: SUPER_LIG_ID,
    season,
  });

  // Filter: at least one Big Four team must be involved
  const bigFourFixtures = fixtures.filter((f) => {
    const homeId = f.teams.home.id;
    const awayId = f.teams.away.id;
    return BIG_FOUR_API_IDS.includes(homeId) || BIG_FOUR_API_IDS.includes(awayId);
  });

  for (const f of bigFourFixtures) {
    try {
      // Find or create teams
      const homeTeam = await findOrCreateTeam(f.teams.home.id, f.teams.home.name, f.teams.home.logo);
      const awayTeam = await findOrCreateTeam(f.teams.away.id, f.teams.away.name, f.teams.away.logo);

      const isDerby = BIG_FOUR_API_IDS.includes(f.teams.home.id) && BIG_FOUR_API_IDS.includes(f.teams.away.id);

      await prisma.match.upsert({
        where: { apiFixtureId: f.fixture.id },
        update: {
          homeScore: f.goals.home,
          awayScore: f.goals.away,
          status: mapStatus(f.fixture.status.short),
          kickoffTime: new Date(f.fixture.date),
        },
        create: {
          apiFixtureId: f.fixture.id,
          season: String(f.league.season),
          week: extractWeek(f.league.round),
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          kickoffTime: new Date(f.fixture.date),
          homeScore: f.goals.home,
          awayScore: f.goals.away,
          isDerby,
          status: mapStatus(f.fixture.status.short),
        },
      });
      synced++;
    } catch (err) {
      errors.push(`Fixture ${f.fixture.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { synced, errors };
}

async function findOrCreateTeam(apiId: number, name: string, logo: string) {
  const isBigFour = BIG_FOUR_API_IDS.includes(apiId);
  const shortName = name.length > 3 ? name.substring(0, 3).toUpperCase() : name.toUpperCase();

  return prisma.team.upsert({
    where: { apiFootballId: apiId },
    update: { logoUrl: logo },
    create: {
      name,
      shortName,
      logoUrl: logo,
      isBigFour,
      apiFootballId: apiId,
    },
  });
}

export async function syncMatchEvents(apiFixtureId: number): Promise<{ goals: number; assists: number }> {
  const events = await apiFootballFetch<ApiFixtureEvent>('fixtures/events', {
    fixture: apiFixtureId,
  });

  const match = await prisma.match.findUnique({
    where: { apiFixtureId },
  });

  if (!match) throw new Error(`Match not found for fixture ${apiFixtureId}`);

  // Clear existing goals and assists for this match
  await prisma.matchGoal.deleteMany({ where: { matchId: match.id } });
  await prisma.matchAssist.deleteMany({ where: { matchId: match.id } });

  const goalEvents = events.filter((e) => e.type === 'Goal' && e.detail !== 'Missed Penalty');

  // Aggregate goals by player
  const goalMap = new Map<string, { playerId: number; teamId: number; count: number }>();
  const assistMap = new Map<string, { playerId: number | null; teamId: number; count: number; isSetPiece: boolean }>();

  for (const event of goalEvents) {
    // Goal scorer
    const goalKey = `${event.player.id}-${event.team.id}`;
    const existing = goalMap.get(goalKey);
    if (existing) {
      existing.count++;
    } else {
      goalMap.set(goalKey, { playerId: event.player.id, teamId: event.team.id, count: 1 });
    }

    // Assist
    const isSetPiece = event.detail === 'Penalty' || !event.assist.id;
    const assistKey = isSetPiece ? `setpiece-${event.team.id}` : `${event.assist.id}-${event.team.id}`;
    const existingAssist = assistMap.get(assistKey);
    if (existingAssist) {
      existingAssist.count++;
    } else {
      assistMap.set(assistKey, {
        playerId: isSetPiece ? null : event.assist.id!,
        teamId: event.team.id,
        count: 1,
        isSetPiece,
      });
    }
  }

  // Save goals
  for (const goal of goalMap.values()) {
    const player = await prisma.player.findUnique({ where: { apiFootballId: goal.playerId } });
    const team = await prisma.team.findUnique({ where: { apiFootballId: goal.teamId } });
    if (player && team) {
      await prisma.matchGoal.create({
        data: { matchId: match.id, playerId: player.id, teamId: team.id, count: goal.count },
      });
    }
  }

  // Save assists
  for (const assist of assistMap.values()) {
    const team = await prisma.team.findUnique({ where: { apiFootballId: assist.teamId } });
    let playerId: string | null = null;
    if (!assist.isSetPiece && assist.playerId) {
      const player = await prisma.player.findUnique({ where: { apiFootballId: assist.playerId } });
      playerId = player?.id || null;
    }
    if (team) {
      await prisma.matchAssist.create({
        data: { matchId: match.id, playerId, teamId: team.id, count: assist.count, isSetPiece: assist.isSetPiece },
      });
    }
  }

  return { goals: goalMap.size, assists: assistMap.size };
}

export async function syncPlayers(teamApiId: number, season: number): Promise<number> {
  const players = await apiFootballFetch<ApiPlayer>('players', {
    team: teamApiId,
    season,
    league: SUPER_LIG_ID,
  });

  const team = await prisma.team.findUnique({ where: { apiFootballId: teamApiId } });
  if (!team) throw new Error(`Team not found for API ID ${teamApiId}`);

  let count = 0;
  for (const p of players) {
    const position = p.statistics?.[0]?.games?.position || '';
    await prisma.player.upsert({
      where: { apiFootballId: p.player.id },
      update: { name: p.player.name, position, teamId: team.id },
      create: {
        name: p.player.name,
        position,
        teamId: team.id,
        apiFootballId: p.player.id,
      },
    });
    count++;
  }

  return count;
}
