'use client';

import { useState, useEffect } from 'react';
import { Save, Lock, Plus, Minus, X, AlertTriangle, Loader2, Award } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  isBigFour: boolean;
  apiFootballId: number;
  players?: Player[];
}

interface GoalScorerEntry {
  playerId: string;
  teamId: string;
  count: number;
}

interface AssistEntry {
  playerId: string | null;
  teamId: string;
  count: number;
  isSetPiece: boolean;
}

interface PredictionFormProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: string;
  isDerby: boolean;
  isLocked: boolean;
  status: string;
}

export function PredictionForm({ matchId, homeTeam, awayTeam, kickoffTime, isDerby, isLocked: initialLocked, status }: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [goalScorers, setGoalScorers] = useState<GoalScorerEntry[]>([]);
  const [assists, setAssists] = useState<AssistEntry[]>([]);
  const [motmPlayerId, setMotmPlayerId] = useState<string | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [loaded, setLoaded] = useState(false);

  // Check lock status periodically
  useEffect(() => {
    const check = () => {
      if (new Date() >= new Date(kickoffTime)) setIsLocked(true);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [kickoffTime]);

  // Load players for Big Four teams
  useEffect(() => {
    const loadPlayers = async (teamId: string, isBigFour: boolean) => {
      if (!isBigFour) return [];
      try {
        const res = await fetch(`/api/players?teamId=${teamId}`);
        const data = await res.json();
        return data.players || [];
      } catch { return []; }
    };

    Promise.all([
      loadPlayers(homeTeam.id, homeTeam.isBigFour),
      loadPlayers(awayTeam.id, awayTeam.isBigFour),
    ]).then(([hp, ap]) => {
      setHomePlayers(hp);
      setAwayPlayers(ap);
    });
  }, [homeTeam.id, awayTeam.id]);

  // Load existing prediction
  useEffect(() => {
    fetch(`/api/predictions?matchId=${matchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.prediction) {
          const p = data.prediction;
          setHomeScore(p.homeScorePred);
          setAwayScore(p.awayScorePred);
          setMotmPlayerId(p.motmPlayerId);
          setGoalScorers(p.goalScorers?.map((gs: any) => ({
            playerId: gs.playerId || gs.player?.id,
            teamId: gs.teamId || gs.team?.id,
            count: gs.count,
          })) || []);
          setAssists(p.assists?.map((a: any) => ({
            playerId: a.playerId || a.player?.id || null,
            teamId: a.teamId || a.team?.id,
            count: a.count,
            isSetPiece: a.isSetPiece,
          })) || []);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [matchId]);

  const getTeamGoalCount = (teamId: string) =>
    goalScorers.filter(g => g.teamId === teamId).reduce((sum, g) => sum + g.count, 0);
  const getTeamAssistCount = (teamId: string) =>
    assists.filter(a => a.teamId === teamId).reduce((sum, a) => sum + a.count, 0);

  const addGoalScorer = (teamId: string) => {
    if (getTeamGoalCount(teamId) >= 4) return;
    const players = teamId === homeTeam.id ? homePlayers : awayPlayers;
    if (players.length === 0) return;
    setGoalScorers([...goalScorers, { playerId: players[0].id, teamId, count: 1 }]);
  };

  const addAssist = (teamId: string, isSetPiece: boolean = false) => {
    if (getTeamAssistCount(teamId) >= 4) return;
    if (isSetPiece) {
      setAssists([...assists, { playerId: null, teamId, count: 1, isSetPiece: true }]);
    } else {
      const players = teamId === homeTeam.id ? homePlayers : awayPlayers;
      if (players.length === 0) return;
      setAssists([...assists, { playerId: players[0].id, teamId, count: 1, isSetPiece: false }]);
    }
  };

  const removeGoalScorer = (index: number) => {
    setGoalScorers(goalScorers.filter((_, i) => i !== index));
  };

  const removeAssist = (index: number) => {
    setAssists(assists.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isLocked) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          homeScorePred: homeScore,
          awayScorePred: awayScore,
          goalScorers,
          assists,
          motmPlayerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Tahmin kaydedilemedi' });
      } else {
        setMessage({ type: 'success', text: 'Tahmin başarıyla kaydedildi! ✅' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası' });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-blue-400" size={24} />
      </div>
    );
  }

  const allPlayers = [...homePlayers, ...awayPlayers];

  return (
    <div className="relative">
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
          <Lock size={48} className="text-red-400 mb-3 lock-pulse" />
          <p className="text-red-400 font-bold text-lg">Tahminler Kilitlendi</p>
          <p className="text-slate-400 text-sm mt-1">Maç başladığı için tahmin yapılamaz</p>
        </div>
      )}

      <div className={`space-y-6 ${isLocked ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Derby badge */}
        {isDerby && (
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 px-4 py-1.5 rounded-full text-sm font-bold">
              🔥 DERBİ — Tüm puanlar x2!
            </span>
          </div>
        )}

        {/* Score Prediction */}
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-center text-sm font-medium text-slate-400 mb-4">Skor Tahmini (15 Puan)</h3>
          <div className="flex items-center justify-center gap-6">
            {/* Home Score */}
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">{homeTeam.shortName}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <span className="text-3xl font-black w-12 text-center">{homeScore}</span>
                <button
                  onClick={() => setHomeScore(Math.min(20, homeScore + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <span className="text-2xl text-slate-500 font-bold">-</span>

            {/* Away Score */}
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">{awayTeam.shortName}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <span className="text-3xl font-black w-12 text-center">{awayScore}</span>
                <button
                  onClick={() => setAwayScore(Math.min(20, awayScore + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Scorers */}
        {[homeTeam, awayTeam].filter(t => t.isBigFour).map(team => {
          const players = team.id === homeTeam.id ? homePlayers : awayPlayers;
          const teamGoals = goalScorers.filter(g => g.teamId === team.id);
          const totalGoals = teamGoals.reduce((s, g) => s + g.count, 0);
          return (
            <div key={`goals-${team.id}`} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">⚽ {team.name} — Golcüler</h4>
                <span className="text-xs text-slate-400">{totalGoals}/4</span>
              </div>
              {teamGoals.map((gs, idx) => {
                const globalIdx = goalScorers.indexOf(gs);
                return (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select
                      value={gs.playerId}
                      onChange={e => {
                        const updated = [...goalScorers];
                        updated[globalIdx] = { ...gs, playerId: e.target.value };
                        setGoalScorers(updated);
                      }}
                      className="flex-1 bg-slate-700 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 outline-none"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        const updated = [...goalScorers];
                        if (gs.count > 1) {
                          updated[globalIdx] = { ...gs, count: gs.count - 1 };
                          setGoalScorers(updated);
                        }
                      }} className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center hover:bg-slate-500">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{gs.count}</span>
                      <button onClick={() => {
                        if (totalGoals < 4) {
                          const updated = [...goalScorers];
                          updated[globalIdx] = { ...gs, count: gs.count + 1 };
                          setGoalScorers(updated);
                        }
                      }} className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center hover:bg-slate-500">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeGoalScorer(globalIdx)} className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
              {totalGoals < 4 && players.length > 0 && (
                <button
                  onClick={() => addGoalScorer(team.id)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-1"
                >
                  <Plus size={14} /> Golcü Ekle
                </button>
              )}
            </div>
          );
        })}

        {/* Assists */}
        {[homeTeam, awayTeam].filter(t => t.isBigFour).map(team => {
          const players = team.id === homeTeam.id ? homePlayers : awayPlayers;
          const teamAssists = assists.filter(a => a.teamId === team.id);
          const totalAssists = teamAssists.reduce((s, a) => s + a.count, 0);
          return (
            <div key={`assists-${team.id}`} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">👟 {team.name} — Asistler</h4>
                <span className="text-xs text-slate-400">{totalAssists}/4</span>
              </div>
              {teamAssists.map((a, idx) => {
                const globalIdx = assists.indexOf(a);
                return (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    {a.isSetPiece ? (
                      <span className="flex-1 bg-slate-700/50 text-sm rounded-lg px-3 py-2 text-yellow-400 italic">
                        ⚡ Duran Top / Asist Yok
                      </span>
                    ) : (
                      <select
                        value={a.playerId || ''}
                        onChange={e => {
                          const updated = [...assists];
                          updated[globalIdx] = { ...a, playerId: e.target.value };
                          setAssists(updated);
                        }}
                        className="flex-1 bg-slate-700 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 outline-none"
                      >
                        {players.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        const updated = [...assists];
                        if (a.count > 1) { updated[globalIdx] = { ...a, count: a.count - 1 }; setAssists(updated); }
                      }} className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center hover:bg-slate-500">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{a.count}</span>
                      <button onClick={() => {
                        if (totalAssists < 4) {
                          const updated = [...assists]; updated[globalIdx] = { ...a, count: a.count + 1 }; setAssists(updated);
                        }
                      }} className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center hover:bg-slate-500">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeAssist(globalIdx)} className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
              {totalAssists < 4 && (
                <div className="flex gap-2 mt-1">
                  {players.length > 0 && (
                    <button onClick={() => addAssist(team.id, false)} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                      <Plus size={14} /> Asistçi Ekle
                    </button>
                  )}
                  <button onClick={() => addAssist(team.id, true)} className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm">
                    <Plus size={14} /> Duran Top
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* MOTM */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Award size={16} className="text-yellow-400" /> Maçın Adamı (1 Puan)
          </h4>
          <select
            value={motmPlayerId || ''}
            onChange={e => setMotmPlayerId(e.target.value || null)}
            className="w-full bg-slate-700 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 outline-none"
          >
            <option value="">Seçim yapılmadı</option>
            {homeTeam.isBigFour && (
              <optgroup label={homeTeam.name}>
                {homePlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
            {awayTeam.isBigFour && (
              <optgroup label={awayTeam.name}>
                {awayPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} flex items-center gap-2`}>
            {message.type === 'error' && <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || isLocked}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</>
          ) : (
            <><Save size={16} /> Tahmini Kaydet</>
          )}
        </button>
      </div>
    </div>
  );
}
