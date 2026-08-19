export interface MatchResult {
  homeScore: number;
  awayScore: number;
  goalScorers: GoalScorerEntry[];
  assists: AssistEntry[];
  motmPlayerId: string | null;
  isDerby: boolean;
}

export interface GoalScorerEntry {
  playerId: string;
  teamId: string;
  count: number;
}

export interface AssistEntry {
  playerId: string | null; // null means set piece / no assist
  teamId: string;
  count: number;
  isSetPiece: boolean;
}

export interface UserPrediction {
  homeScorePred: number;
  awayScorePred: number;
  goalScorerPreds: GoalScorerEntry[];
  assistPreds: AssistEntry[];
  motmPlayerId: string | null;
}

export interface ScoreBreakdown {
  scorePoints: number;
  goalPoints: number;
  assistPoints: number;
  motmPoints: number;
  scoreBonusApplied: boolean;
  derbyMultiplierApplied: boolean;
  totalPoints: number;
  details: {
    exactScoreMatch: boolean;
    matchedGoalScorers: { playerId: string; matched: number }[];
    matchedAssists: { playerId: string | null; matched: number; isSetPiece: boolean }[];
    motmCorrect: boolean;
  };
}

export interface MatchWithTeams {
  id: string;
  season: string;
  week: number;
  homeTeam: { id: string; name: string; shortName: string; logoUrl: string; apiFootballId: number; isBigFour: boolean };
  awayTeam: { id: string; name: string; shortName: string; logoUrl: string; apiFootballId: number; isBigFour: boolean };
  kickoffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  isDerby: boolean;
  status: string;
  isLocked: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
  teamId: string;
  apiFootballId: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  matchCount: number;
  rank: number;
}
