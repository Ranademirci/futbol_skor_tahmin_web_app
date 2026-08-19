'use client';

import { useState, useEffect } from 'react';
import { Trophy, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Maçlar çekilemedi');
      const data = await res.json();
      setMatches(data.matches.filter((m: any) => m.status !== 'FINISHED'));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Admin Paneli
        </h1>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Oynanmamış Maçlar</h2>
        
        {matches.length === 0 ? (
          <p className="text-gray-400">Bekleyen maç bulunmuyor.</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm text-gray-400 w-24">
                    {new Date(match.kickoffTime).toLocaleDateString('tr-TR')}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end font-bold text-lg">
                    {match.homeTeam.name}
                  </div>
                  <div className="px-4 text-gray-500 font-bold">VS</div>
                  <div className="flex items-center gap-2 flex-1 font-bold text-lg">
                    {match.awayTeam.name}
                  </div>
                </div>
                
                <Link
                  href={`/admin/match/${match.id}`}
                  className="mt-4 md:mt-0 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  Sonuç Gir
                  <CheckCircle className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
