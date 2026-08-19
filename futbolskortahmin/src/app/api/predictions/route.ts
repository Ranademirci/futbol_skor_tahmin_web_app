import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { predictionSchema } from '@/lib/validators/prediction';

export const dynamic = 'force-dynamic';

// GET user's prediction for a match
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return Response.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  }

  const matchId = request.nextUrl.searchParams.get('matchId');
  if (!matchId) {
    return Response.json({ error: 'matchId gerekli' }, { status: 400 });
  }

  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: user.id, matchId } },
    include: {
      goalScorers: { include: { player: true, team: true } },
      assists: { include: { player: true, team: true } },
      motmPlayer: true,
      score: true,
    },
  });

  return Response.json({ prediction });
}

// POST create or update prediction
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return Response.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = predictionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // CRITICAL: Check kickoff time lock
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      return Response.json({ error: 'Maç bulunamadı' }, { status: 404 });
    }

    const now = new Date();
    if (now >= match.kickoffTime) {
      return Response.json(
        { error: 'Maç başlamış! Tahmin girişi kilitlendi.' },
        { status: 403 }
      );
    }

    // Validate: non-big-four teams cannot have player selections
    for (const gs of data.goalScorers) {
      const gsTeam = gs.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
      if (!gsTeam.isBigFour) {
        return Response.json(
          { error: `${gsTeam.name} için oyuncu seçimi yapılamaz (4 Büyükler dışı)` },
          { status: 400 }
        );
      }
    }
    for (const a of data.assists) {
      if (a.isSetPiece) continue;
      const aTeam = a.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
      if (!aTeam.isBigFour) {
        return Response.json(
          { error: `${aTeam.name} için asist seçimi yapılamaz (4 Büyükler dışı)` },
          { status: 400 }
        );
      }
    }

    // Upsert prediction
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId: data.matchId } },
      update: {
        homeScorePred: data.homeScorePred,
        awayScorePred: data.awayScorePred,
        motmPlayerId: data.motmPlayerId,
      },
      create: {
        userId: user.id,
        matchId: data.matchId,
        homeScorePred: data.homeScorePred,
        awayScorePred: data.awayScorePred,
        motmPlayerId: data.motmPlayerId,
      },
    });

    // Delete and recreate goal scorers
    await prisma.predictionGoalScorer.deleteMany({ where: { predictionId: prediction.id } });
    for (const gs of data.goalScorers) {
      await prisma.predictionGoalScorer.create({
        data: {
          predictionId: prediction.id,
          playerId: gs.playerId,
          teamId: gs.teamId,
          count: gs.count,
        },
      });
    }

    // Delete and recreate assists
    await prisma.predictionAssist.deleteMany({ where: { predictionId: prediction.id } });
    for (const a of data.assists) {
      await prisma.predictionAssist.create({
        data: {
          predictionId: prediction.id,
          playerId: a.isSetPiece ? null : a.playerId,
          teamId: a.teamId,
          count: a.count,
          isSetPiece: a.isSetPiece,
        },
      });
    }

    return Response.json({ prediction });
  } catch (error) {
    console.error('Prediction error:', error);
    return Response.json({ error: 'Tahmin kaydedilemedi' }, { status: 500 });
  }
}
