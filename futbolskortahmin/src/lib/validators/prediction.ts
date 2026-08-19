import { z } from 'zod';
import { MAX_GOALS_PER_TEAM, MAX_ASSISTS_PER_TEAM } from '../constants';

const goalScorerSchema = z.object({
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  count: z.number().int().min(1).max(4),
});

const assistSchema = z.object({
  playerId: z.string().nullable(),
  teamId: z.string().min(1),
  count: z.number().int().min(1).max(4),
  isSetPiece: z.boolean(),
});

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScorePred: z.number().int().min(0).max(20),
  awayScorePred: z.number().int().min(0).max(20),
  goalScorers: z.array(goalScorerSchema).default([]),
  assists: z.array(assistSchema).default([]),
  motmPlayerId: z.string().nullable().default(null),
}).refine((data) => {
  // Validate max goals per team
  const goalsByTeam = new Map<string, number>();
  for (const gs of data.goalScorers) {
    goalsByTeam.set(gs.teamId, (goalsByTeam.get(gs.teamId) || 0) + gs.count);
  }
  for (const count of goalsByTeam.values()) {
    if (count > MAX_GOALS_PER_TEAM) return false;
  }
  // Validate max assists per team
  const assistsByTeam = new Map<string, number>();
  for (const a of data.assists) {
    assistsByTeam.set(a.teamId, (assistsByTeam.get(a.teamId) || 0) + a.count);
  }
  for (const count of assistsByTeam.values()) {
    if (count > MAX_ASSISTS_PER_TEAM) return false;
  }
  return true;
}, {
  message: `Her takım için en fazla ${MAX_GOALS_PER_TEAM} gol ve ${MAX_ASSISTS_PER_TEAM} asist seçilebilir.`,
});

export const loginSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
  firstName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyisim en az 2 karakter olmalı'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
