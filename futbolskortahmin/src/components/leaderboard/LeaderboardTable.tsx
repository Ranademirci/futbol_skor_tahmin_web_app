'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  matchCount: number;
  rank: number;
}

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<'season' | 'weekly' | 'match'>('season');
  const [week, setWeek] = useState<number | null>(1);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Maçları çek (Sadece bitmiş olanları)
  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        const finished = data.matches.filter((m: any) => m.status === 'FINISHED');
        setMatches(finished);
        if (finished.length > 0) setSelectedMatchId(finished[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/api/leaderboard?type=${tab}`;
    if (tab === 'weekly' && week) url += `&week=${week}`;
    if (tab === 'match' && selectedMatchId) url += `&matchId=${selectedMatchId}`;
    
    // Eğer maç seçilmemişse fetch yapma
    if (tab === 'match' && !selectedMatchId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setEntries(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, week, selectedMatchId]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={18} className="text-gray-300" />;
    if (rank === 3) return <Award size={18} className="text-amber-600" />;
    return <span className="text-slate-400 text-sm font-mono w-5 text-center">{rank}</span>;
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['season', 'weekly', 'match'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {t === 'season' ? '🏆 Genel (Tümü)' : t === 'weekly' ? '📅 Haftalık' : '⚽ Maç Bazlı'}
          </button>
        ))}
      </div>

      {tab === 'weekly' && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-slate-400 font-bold">Hafta Seçin:</label>
          <input
            type="number"
            min={1}
            max={40}
            placeholder="Örn: 1"
            value={week || ''}
            onChange={e => setWeek(parseInt(e.target.value) || null)}
            className="bg-slate-800 text-sm font-bold rounded-lg px-4 py-2 border border-slate-700 w-24 outline-none focus:border-blue-500"
          />
        </div>
      )}

      {tab === 'match' && (
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-sm text-slate-400 font-bold">Bir Maç Seçin:</label>
          {matches.length === 0 ? (
            <div className="text-sm text-red-400">Henüz bitmiş hiçbir maç bulunmuyor.</div>
          ) : (
            <select 
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-slate-800 text-sm font-bold rounded-lg px-4 py-3 border border-slate-700 w-full md:w-96 outline-none focus:border-blue-500"
            >
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam.name} {m.homeScore} - {m.awayScore} {m.awayTeam.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-400" size={24} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>Henüz sıralama verisi yok</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium w-12">#</th>
                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Kullanıcı</th>
                <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">Maç</th>
                <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">Puan</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.userId} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-4 py-3">{rankIcon(entry.rank)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{entry.firstName} {entry.lastName}</p>
                    <p className="text-xs text-slate-400">@{entry.username}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-400">{entry.matchCount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-bold text-blue-400">{entry.totalPoints}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
