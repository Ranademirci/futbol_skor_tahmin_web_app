'use client';

import { useState, useEffect } from 'react';
import { MatchCard } from './MatchCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Match {
  id: string;
  week: number;
  homeTeam: { name: string; shortName: string; logoUrl: string; isBigFour: boolean; apiFootballId: number };
  awayTeam: { name: string; shortName: string; logoUrl: string; isBigFour: boolean; apiFootballId: number };
  kickoffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  isDerby: boolean;
  status: string;
  isLocked: boolean;
}

export function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [week, setWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);

  useEffect(() => {
    fetchMatches();
  }, [week]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = week ? `?week=${week}` : '';
      const res = await fetch(`/api/matches${params}`);
      const data = await res.json();
      setMatches(data.matches || []);

      // Extract available weeks
      if (!week && data.matches) {
        const weeks = [...new Set(data.matches.map((m: Match) => m.week))] as number[];
        setAvailableWeeks(weeks.sort((a, b) => a - b));
        // Auto-select current/closest week
        if (weeks.length > 0 && !week) {
          const now = new Date();
          const closest = data.matches.reduce((prev: Match, curr: Match) => {
            return Math.abs(new Date(curr.kickoffTime).getTime() - now.getTime()) <
              Math.abs(new Date(prev.kickoffTime).getTime() - now.getTime())
              ? curr : prev;
          });
          setWeek(closest.week);
        }
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Week Selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => week && setWeek(Math.max(1, week - 1))}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          disabled={!week || week <= 1}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="bg-slate-800 px-6 py-2 rounded-lg min-w-[120px] text-center">
          <span className="text-xs text-slate-400 block">Hafta</span>
          <span className="text-xl font-bold">{week || '-'}</span>
        </div>
        <button
          onClick={() => week && setWeek(week + 1)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">Bu hafta için maç bulunamadı</p>
          <p className="text-sm mt-2">API senkronizasyonu yapılmamış olabilir</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
