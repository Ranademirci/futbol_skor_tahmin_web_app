import { POINTS } from '../constants';
import type { MatchResult, UserPrediction, ScoreBreakdown, GoalScorerEntry, AssistEntry } from '../types';

/**
 * Calculates the score for a user's prediction against the actual match result.
 * Pure function - no database access, fully testable.
 *
 * Scoring rules:
 * 1. Exact score match: 15 points
 * 2. Correct goal scorer (per matched name/count): 1 point each
 * 3. Correct assist (per matched name/count or set piece): 1 point each
 * 4. Correct MOTM: 1 point
 * 5. If exact score matched: (goalPoints + assistPoints) * 2
 * 6. If derby: totalPoints * 2
 */
export function calculateMatchScore(
  prediction: UserPrediction,
  result: MatchResult
): ScoreBreakdown {
  // 1. Check exact score
  const exactScoreMatch =
    prediction.homeScorePred === result.homeScore &&
    prediction.awayScorePred === result.awayScore;
  const scorePoints = exactScoreMatch ? POINTS.EXACT_SCORE : 0;

  // 2. Calculate goal scorer points
  const { points: goalPoints, matched: matchedGoalScorers } = calculateGoalScorerPoints(
    prediction.goalScorerPreds,
    result.goalScorers
  );

  // 3. Calculate assist points
  const { points: assistPoints, matched: matchedAssists } = calculateAssistPoints(
    prediction.assistPreds,
    result.assists
  );

  // 4. MOTM points
  const motmCorrect =
    prediction.motmPlayerId !== null &&
    result.motmPlayerId !== null &&
    prediction.motmPlayerId === result.motmPlayerId;
  const motmPoints = motmCorrect ? POINTS.CORRECT_MOTM : 0;

  // 5. Apply score bonus: if exact score, multiply goal+assist points by 2
  const scoreBonusApplied = exactScoreMatch;
  const goalAssistTotal = scoreBonusApplied
    ? (goalPoints + assistPoints) * POINTS.SCORE_BONUS_MULTIPLIER
    : goalPoints + assistPoints;

  // 6. Calculate base total
  let totalPoints = scorePoints + goalAssistTotal + motmPoints;

  // 7. Apply derby multiplier
  const derbyMultiplierApplied = result.isDerby;
  if (derbyMultiplierApplied) {
    totalPoints = totalPoints * POINTS.DERBY_MULTIPLIER;
  }

  return {
    scorePoints,
    goalPoints,
    assistPoints,
    motmPoints,
    scoreBonusApplied,
    derbyMultiplierApplied,
    totalPoints,
    details: {
      exactScoreMatch,
      matchedGoalScorers,
      matchedAssists,
      motmCorrect,
    },
  };
}

/**
 * Compares predicted goal scorers against actual goal scorers.
 * Matching logic: For each predicted player, check if the actual results contain
 * that player with at least the predicted count. Award 1 point per matched goal.
 */
function calculateGoalScorerPoints(
  predicted: GoalScorerEntry[],
  actual: GoalScorerEntry[]
): { points: number; matched: { playerId: string; matched: number }[] } {
  let points = 0;
  const matched: { playerId: string; matched: number }[] = [];

  for (const pred of predicted) {
    const actualEntry = actual.find(
      (a) => a.playerId === pred.playerId && a.teamId === pred.teamId
    );
    if (actualEntry) {
      // Award points for the minimum of predicted and actual count
      const matchedCount = Math.min(pred.count, actualEntry.count);
      points += matchedCount * POINTS.CORRECT_GOAL_SCORER;
      matched.push({ playerId: pred.playerId, matched: matchedCount });
    }
  }

  return { points, matched };
}

/**
 * Compares predicted assists against actual assists.
 * Set piece predictions (isSetPiece=true, playerId=null) are compared separately.
 */
function calculateAssistPoints(
  predicted: AssistEntry[],
  actual: AssistEntry[]
): { points: number; matched: { playerId: string | null; matched: number; isSetPiece: boolean }[] } {
  let points = 0;
  const matched: { playerId: string | null; matched: number; isSetPiece: boolean }[] = [];

  for (const pred of predicted) {
    let actualEntry: AssistEntry | undefined;

    if (pred.isSetPiece) {
      // Match set piece assists by team
      actualEntry = actual.find(
        (a) => a.isSetPiece && a.teamId === pred.teamId
      );
    } else {
      // Match named player assists
      actualEntry = actual.find(
        (a) => a.playerId === pred.playerId && a.teamId === pred.teamId && !a.isSetPiece
      );
    }

    if (actualEntry) {
      const matchedCount = Math.min(pred.count, actualEntry.count);
      points += matchedCount * POINTS.CORRECT_ASSIST;
      matched.push({
        playerId: pred.playerId,
        matched: matchedCount,
        isSetPiece: pred.isSetPiece,
      });
    }
  }

  return { points, matched };
}
