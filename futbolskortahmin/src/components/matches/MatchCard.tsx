'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Clock, Flame, CheckCircle } from 'lucide-react';

interface MatchCardProps {
  match: {
    id: string;
    homeTeam: { name: string; shortName: string; logoUrl: string; isBigFour: boolean; apiFootballId: number };
    awayTeam: { name: string; shortName: string; logoUrl: string; isBigFour: boolean; apiFootballId: number };
    kickoffTime: string;
    homeScore: number | null;
    awayScore: number | null;
    isDerby: boolean;
    status: string;
    isLocked: boolean;
  };
}

const TEAM_GRADIENT: Record<number, string> = {
  645: 'from-yellow-500/20 to-red-600/20',
  611: 'from-yellow-400/20 to-blue-800/20',
  549: 'from-gray-700/20 to-gray-300/20',
  556: 'from-red-900/20 to-cyan-400/20',
};

export function MatchCard({ match }: MatchCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const kickoff = new Date(match.kickoffTime);
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = kickoff.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) setTimeLeft(`${days}g ${hours}s ${mins}dk`);
      else if (hours > 0) setTimeLeft(`${hours}s ${mins}dk`);
      else setTimeLeft(`${mins}dk`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [match.kickoffTime]);

  const borderClass = match.isDerby
    ? 'border-2 border-transparent bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500 p-[2px] rounded-xl'
    : '';

  const homeGradient = TEAM_GRADIENT[match.homeTeam.apiFootballId] || 'from-slate-700/20 to-slate-600/20';
  const awayGradient = TEAM_GRADIENT[match.awayTeam.apiFootballId] || 'from-slate-600/20 to-slate-700/20';

  return (
    <div className={borderClass}>
      <Link href={`/matches/${match.id}`}>
        <div className={`bg-slate-900 rounded-xl p-4 hover:bg-slate-800/80 transition cursor-pointer relative overflow-hidden`}>
          {/* Derby badge */}
          {match.isDerby && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">
              <Flame size={12} /> DERBİ x2
            </div>
          )}

          {/* Status badge */}
          <div className="flex justify-center mb-3">
            {isLive && (
              <span className="bg-red-500/20 text-red-400 px-3 py-0.5 rounded-full text-xs font-bold animate-pulse">
                🔴 CANLI
              </span>
            )}
            {isFinished && (
              <span className="bg-green-500/20 text-green-400 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle size={12} /> BİTTİ
              </span>
            )}
            {!isLive && !isFinished && timeLeft && (
              <span className="bg-blue-500/20 text-blue-400 px-3 py-0.5 rounded-full text-xs flex items-center gap-1">
                <Clock size={12} /> {timeLeft}
              </span>
            )}
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className={`flex-1 text-center p-3 rounded-lg bg-gradient-to-br ${homeGradient}`}>
              {match.homeTeam.logoUrl && (
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
              )}
              <p className="font-bold text-sm truncate">{match.homeTeam.name}</p>
              {!match.homeTeam.isBigFour && (
                <span className="text-[10px] text-slate-500">🔒 Tahmin kapalı</span>
              )}
            </div>

            {/* Score */}
            <div className="text-center px-4">
              {isFinished || isLive ? (
                <div className="text-3xl font-black">
                  <span>{match.homeScore}</span>
                  <span className="text-slate-500 mx-2">-</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : (
                <div className="text-lg text-slate-400">
                  {kickoff.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                {kickoff.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            </div>

            {/* Away Team */}
            <div className={`flex-1 text-center p-3 rounded-lg bg-gradient-to-br ${awayGradient}`}>
              {match.awayTeam.logoUrl && (
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
              )}
              <p className="font-bold text-sm truncate">{match.awayTeam.name}</p>
              {!match.awayTeam.isBigFour && (
                <span className="text-[10px] text-slate-500">🔒 Tahmin kapalı</span>
              )}
            </div>
          </div>

          {/* Lock indicator */}
          {match.isLocked && !isFinished && (
            <div className="mt-3 flex items-center justify-center gap-1 text-red-400 text-xs lock-pulse">
              <Lock size={12} /> Tahminler kilitlendi
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
