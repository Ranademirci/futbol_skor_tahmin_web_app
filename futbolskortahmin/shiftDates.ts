import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffTime: 'asc' }
  });

  if (matches.length === 0) {
    console.log("Kaydırılacak maç bulunamadı.");
    return;
  }

  // Bugünden (19 Ağustos 2026) başlatarak her maçı 1 gün arayla geleceğe dağıtalım
  let currentDate = new Date('2026-08-20T19:00:00Z');

  let updatedCount = 0;
  for (const match of matches) {
    // Sadece 4 büyüklerin maçlarını geleceğe taşıyoruz
    await prisma.match.update({
      where: { id: match.id },
      data: {
        kickoffTime: new Date(currentDate),
        status: 'SCHEDULED', // Hepsi henüz oynanmamış olsun
        homeScore: null,
        awayScore: null,
      }
    });

    // Puanları, golleri ve asistleri temizle (maç oynanmamış gibi olsun)
    await prisma.matchGoal.deleteMany({ where: { matchId: match.id } });
    await prisma.matchAssist.deleteMany({ where: { matchId: match.id } });
    await prisma.userScore.deleteMany({ where: { matchId: match.id } });

    // Bir sonraki maçı 1 gün ileriye koy
    currentDate.setDate(currentDate.getDate() + 1);
    updatedCount++;
  }

  console.log(`${updatedCount} adet maçın tarihi 20 Ağustos 2026 ve sonrasına başarıyla kaydırıldı!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
