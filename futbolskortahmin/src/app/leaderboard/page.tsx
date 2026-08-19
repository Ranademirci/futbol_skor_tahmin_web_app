import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🏆 Liderlik Tablosu</h1>
      <LeaderboardTable />
    </div>
  );
}
