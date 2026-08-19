import prisma from '@/lib/prisma';
import { PredictionForm } from '@/components/predictions/PredictionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function MatchDetailPage(props: PageProps<'/matches/[matchId]'>) {
  const { matchId } = await props.params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Maç bulunamadı</p>
        <Link href="/" className="text-blue-400 hover:underline mt-2 inline-block">← Ana Sayfa</Link>
      </div>
    );
  }

  const now = new Date();
  const isLocked = now >= match.kickoffTime;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={16} /> Maçlara Dön
      </Link>

      {/* Match Header */}
      <div className="bg-slate-800/50 rounded-xl p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            {match.homeTeam.logoUrl && (
              <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
            )}
            <p className="font-bold">{match.homeTeam.name}</p>
          </div>
          <div>
            {match.status === 'FINISHED' || match.status === 'LIVE' ? (
              <div className="text-4xl font-black">
                {match.homeScore} <span className="text-slate-500">-</span> {match.awayScore}
              </div>
            ) : (
              <div className="text-xl text-slate-400">vs</div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {match.kickoffTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-center">
            {match.awayTeam.logoUrl && (
              <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
            )}
            <p className="font-bold">{match.awayTeam.name}</p>
          </div>
        </div>
        {match.isDerby && (
          <div className="mt-3">
            <span className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 px-4 py-1 rounded-full text-sm font-bold">
              🔥 DERBİ — Puanlar x2
            </span>
          </div>
        )}
      </div>

      {/* Prediction Form */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-bold mb-4">📝 Tahminini Yap</h2>
        <PredictionForm
          matchId={match.id}
          homeTeam={{
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName,
            isBigFour: match.homeTeam.isBigFour,
            apiFootballId: match.homeTeam.apiFootballId,
          }}
          awayTeam={{
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName,
            isBigFour: match.awayTeam.isBigFour,
            apiFootballId: match.awayTeam.apiFootballId,
          }}
          kickoffTime={match.kickoffTime.toISOString()}
          isDerby={match.isDerby}
          isLocked={isLocked}
          status={match.status}
        />
      </div>
    </div>
  );
}
