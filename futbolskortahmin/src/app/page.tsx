import { MatchList } from '@/components/matches/MatchList';

export default function HomePage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-blue-500 bg-clip-text text-transparent">
            Süper Lig Tahmin
          </span>
        </h1>
        <p className="text-slate-400 text-sm">4 Büyükler · Maç Tahmini · Liderlik Tablosu</p>
      </div>
      <MatchList />
    </div>
  );
}
