// API-Football IDs for 4 Big Four teams
export const BIG_FOUR_IDS = {
  GALATASARAY: 645,
  FENERBAHCE: 611,
  BESIKTAS: 549,
  TRABZONSPOR: 998,
} as const;

export const BIG_FOUR_API_IDS = Object.values(BIG_FOUR_IDS);

// Team colors for UI
export const TEAM_COLORS: Record<number, { primary: string; secondary: string; gradient: string }> = {
  645: { primary: '#FDB913', secondary: '#C8102E', gradient: 'from-yellow-500 to-red-600' },
  611: { primary: '#FFED00', secondary: '#0A3D91', gradient: 'from-yellow-400 to-blue-800' },
  549: { primary: '#000000', secondary: '#FFFFFF', gradient: 'from-gray-900 to-white' },
  998: { primary: '#8B0000', secondary: '#00BFFF', gradient: 'from-red-900 to-cyan-400' },
};

// Scoring constants
export const POINTS = {
  EXACT_SCORE: 15,
  CORRECT_GOAL_SCORER: 1,
  CORRECT_ASSIST: 1,
  CORRECT_MOTM: 1,
  SCORE_BONUS_MULTIPLIER: 2,
  DERBY_MULTIPLIER: 2,
} as const;

// Max selections per team per match
export const MAX_GOALS_PER_TEAM = 4;
export const MAX_ASSISTS_PER_TEAM = 4;

// Süper Lig info
export const SUPER_LIG_ID = 203;
export const CURRENT_SEASON = 2026;

// Match statuses
export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
} as const;
