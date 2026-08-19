import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateMatchScore } from '@/lib/scoring/calculateMatchScore';
import type { MatchResult, UserPrediction } from '@/lib/types';

export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return Response.json({ error: 'Lütfen giriş yapın' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { matchId, homeScore, awayScore, motmPlayerId, goals, assists } = data;

    // 1. Önce maçı güncelle ve eski verileri temizle
    await prisma.matchGoal.deleteMany({ where: { matchId } });
    await prisma.matchAssist.deleteMany({ where: { matchId } });

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        motmPlayerId: motmPlayerId || null,
        status: 'FINISHED',
      },
    });

    // 2. Yeni gol ve asist verilerini kaydet
    if (goals && goals.length > 0) {
      for (const g of goals) {
        await prisma.matchGoal.create({
          data: { matchId, playerId: g.playerId, teamId: g.teamId, count: parseInt(g.count) }
        });
      }
    }

    if (assists && assists.length > 0) {
      for (const a of assists) {
        await prisma.matchAssist.create({
          data: { matchId, playerId: a.playerId || null, teamId: a.teamId, count: parseInt(a.count), isSetPiece: !!a.isSetPiece }
        });
      }
    }

    // 3. Hesaplama Motorunu Çalıştır
    const fullMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { goals: true, assists: true },
    });

    if (!fullMatch) throw new Error("Match not found");

    const matchResult: MatchResult = {
      homeScore: fullMatch.homeScore!,
      awayScore: fullMatch.awayScore!,
      goalScorers: fullMatch.goals.map((g) => ({ playerId: g.playerId, teamId: g.teamId, count: g.count })),
      assists: fullMatch.assists.map((a) => ({ playerId: a.playerId, teamId: a.teamId, count: a.count, isSetPiece: a.isSetPiece })),
      motmPlayerId: fullMatch.motmPlayerId,
      isDerby: fullMatch.isDerby,
    };

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: { goalScorers: true, assists: true },
    });

    for (const pred of predictions) {
      const userPrediction: UserPrediction = {
        homeScorePred: pred.homeScorePred,
        awayScorePred: pred.awayScorePred,
        goalScorerPreds: pred.goalScorers.map((gs) => ({ playerId: gs.playerId, teamId: gs.teamId, count: gs.count })),
        assistPreds: pred.assists.map((a) => ({ playerId: a.playerId, teamId: a.teamId, count: a.count, isSetPiece: a.isSetPiece })),
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
    }

    return Response.json({ success: true, message: 'Maç başarıyla bitirildi ve detaylı puanlar hesaplandı!' });
  } catch (error) {
    console.error('Admin finish match detail error:', error);
    return Response.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}
