'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminMatchFinishPage() {
  const { matchId } = useParams();
  const router = useRouter();
  
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [motm, setMotm] = useState('');
  
  // Array of { playerId, teamId, count }
  const [goals, setGoals] = useState<any[]>([]);
  const [assists, setAssists] = useState<any[]>([]);

  useEffect(() => {
    fetchMatchAndPlayers();
  }, [matchId]);

  const fetchMatchAndPlayers = async () => {
    try {
      const matchRes = await fetch(`/api/matches/${matchId}`);
      if (matchRes.ok) {
        const data = await matchRes.json();
        setMatch(data.match);
        
        // Fetch players for both teams
        const pRes = await fetch(`/api/players?teamIds=${data.match.homeTeam.id},${data.match.awayTeam.id}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPlayers(pData.players);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addGoal = () => setGoals([...goals, { playerId: '', teamId: '', count: 1 }]);
  const updateGoal = (index: number, field: string, value: any) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    // Otomatik takım seçimi
    if (field === 'playerId') {
      const player = players.find(p => p.id === value);
      if (player) newGoals[index].teamId = player.teamId;
    }
    setGoals(newGoals);
  };
  const removeGoal = (index: number) => setGoals(goals.filter((_, i) => i !== index));

  const addAssist = () => setAssists([...assists, { playerId: '', teamId: '', count: 1, isSetPiece: false }]);
  const updateAssist = (index: number, field: string, value: any) => {
    const newAssists = [...assists];
    newAssists[index][field] = value;
    if (field === 'playerId') {
      if (value === 'SET_PIECE_HOME') {
        newAssists[index].teamId = match.homeTeam.id;
        newAssists[index].isSetPiece = true;
      } else if (value === 'SET_PIECE_AWAY') {
        newAssists[index].teamId = match.awayTeam.id;
        newAssists[index].isSetPiece = true;
      } else {
        const player = players.find(p => p.id === value);
        if (player) {
          newAssists[index].teamId = player.teamId;
          newAssists[index].isSetPiece = false;
        }
      }
    }
    setAssists(newAssists);
  };
  const removeAssist = (index: number) => setAssists(assists.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const payload = {
      matchId,
      homeScore: parseInt(homeScore) || 0,
      awayScore: parseInt(awayScore) || 0,
      motmPlayerId: motm || null,
      goals: goals.filter(g => g.playerId).map(g => ({ ...g, count: parseInt(g.count) })),
      assists: assists.filter(a => a.playerId).map(a => ({ 
        ...a, 
        playerId: a.playerId.startsWith('SET_PIECE') ? null : a.playerId,
        count: parseInt(a.count) 
      }))
    };

    try {
      const res = await fetch('/api/admin/finish-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Maç başarıyla bitirildi ve detaylı hesaplama yapıldı!");
        router.push('/admin');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  if (!match) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">Maç Sonucu Gir</h1>
      
      <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl">
        <div className="flex-1 text-right font-bold">{match.homeTeam.name}</div>
        <input type="number" value={homeScore} onChange={e => setHomeScore(e.target.value)} className="w-16 h-12 text-center text-2xl bg-gray-900 border rounded" />
        <span className="text-gray-500">-</span>
        <input type="number" value={awayScore} onChange={e => setAwayScore(e.target.value)} className="w-16 h-12 text-center text-2xl bg-gray-900 border rounded" />
        <div className="flex-1 font-bold">{match.awayTeam.name}</div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl space-y-4">
        <h2 className="text-xl font-bold text-yellow-500">Maçın Adamı (MOTM)</h2>
        <select value={motm} onChange={e => setMotm(e.target.value)} className="w-full p-2 bg-gray-900 border rounded">
          <option value="">Seçiniz...</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team.shortName})</option>)}
        </select>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-500">Gol Atanlar</h2>
          <button onClick={addGoal} className="px-3 py-1 bg-green-600 rounded text-sm">+ Ekle</button>
        </div>
        {goals.map((g, i) => (
          <div key={i} className="flex gap-2">
            <select value={g.playerId} onChange={e => updateGoal(i, 'playerId', e.target.value)} className="flex-1 p-2 bg-gray-900 border rounded">
              <option value="">Oyuncu Seç...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team.shortName})</option>)}
            </select>
            <input type="number" value={g.count} onChange={e => updateGoal(i, 'count', e.target.value)} min="1" className="w-20 p-2 text-center bg-gray-900 border rounded" title="Kaç Gol?" />
            <button onClick={() => removeGoal(i)} className="px-3 bg-red-600 rounded">X</button>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-4 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-500">Asist Yapanlar</h2>
          <button onClick={addAssist} className="px-3 py-1 bg-blue-600 rounded text-sm">+ Ekle</button>
        </div>
        {assists.map((a, i) => (
          <div key={i} className="flex gap-2">
            <select value={a.playerId} onChange={e => updateAssist(i, 'playerId', e.target.value)} className="flex-1 p-2 bg-gray-900 border rounded">
              <option value="">Oyuncu Seç...</option>
              <option value="SET_PIECE_HOME">⚡ Duran Top / Asist Yok ({match.homeTeam.shortName})</option>
              <option value="SET_PIECE_AWAY">⚡ Duran Top / Asist Yok ({match.awayTeam.shortName})</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team.shortName})</option>)}
            </select>
            <input type="number" value={a.count} onChange={e => updateAssist(i, 'count', e.target.value)} min="1" className="w-20 p-2 text-center bg-gray-900 border rounded" title="Kaç Asist?" />
            <button onClick={() => removeAssist(i)} className="px-3 bg-red-600 rounded">X</button>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-xl transition-colors">
        Maçı Bitir ve Hesapla
      </button>
    </div>
  );
}
