import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/scoring/calculateMatchScore';
import type { MatchResult, UserPrediction } from '@/lib/types';

export async function POST(request: NextRequest) {
  // Only allow authenticated users (in production, add admin check)
  const user = await getSession();
  if (!user) {
    return Response.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { matchId } = await request.json();
  if (!matchId) {
    return Response.json({ error: 'matchId gerekli' }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      goals: true,
      assists: true,
    },
  });

  if (!match || match.status !== 'FINISHED') {
    return Response.json({ error: 'Maç henüz bitmedi veya bulunamadı' }, { status: 400 });
  }

  // Build match result
  const matchResult: MatchResult = {
    homeScore: match.homeScore!,
    awayScore: match.awayScore!,
    goalScorers: match.goals.map((g) => ({
      playerId: g.playerId,
      teamId: g.teamId,
      count: g.count,
    })),
    assists: match.assists.map((a) => ({
      playerId: a.playerId,
      teamId: a.teamId,
      count: a.count,
      isSetPiece: a.isSetPiece,
    })),
    motmPlayerId: match.motmPlayerId,
    isDerby: match.isDerby,
  };

  // Get all predictions for this match
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: {
      goalScorers: true,
      assists: true,
    },
  });

  let calculated = 0;

  for (const pred of predictions) {
    const userPrediction: UserPrediction = {
      homeScorePred: pred.homeScorePred,
      awayScorePred: pred.awayScorePred,
      goalScorerPreds: pred.goalScorers.map((gs) => ({
        playerId: gs.playerId,
        teamId: gs.teamId,
        count: gs.count,
      })),
      assistPreds: pred.assists.map((a) => ({
        playerId: a.playerId,
        teamId: a.teamId,
        count: a.count,
        isSetPiece: a.isSetPiece,
      })),
      motmPlayerId: pred.motmPlayerId,
    };

    const score = calculateMatchScore(userPrediction, matchResult);

    await prisma.userScore.upsert({
      where: { userId_matchId: { userId: pred.userId, matchId } },
      update: {
        scorePoints: score.scorePoints,
        goalPoints: score.goalPoints,
        assistPoints: score.assistPoints,
        motmPoints: score.motmPoints,
        scoreBonusApplied: score.scoreBonusApplied,
        derbyMultiplierApplied: score.derbyMultiplierApplied,
        totalPoints: score.totalPoints,
        calculatedAt: new Date(),
      },
      create: {
        userId: pred.userId,
        matchId,
        predictionId: pred.id,
        scorePoints: score.scorePoints,
        goalPoints: score.goalPoints,
        assistPoints: score.assistPoints,
        motmPoints: score.motmPoints,
        scoreBonusApplied: score.scoreBonusApplied,
        derbyMultiplierApplied: score.derbyMultiplierApplied,
        totalPoints: score.totalPoints,
      },
    });
    calculated++;
  }

  return Response.json({ calculated, matchId });
}
