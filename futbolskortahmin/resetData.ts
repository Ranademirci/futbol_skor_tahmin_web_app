import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Temizlik başlıyor...");

  // 1. Bitmiş maçların girilen sonuçlarını ve gol/asist detaylarını sil
  await prisma.matchGoal.deleteMany({});
  await prisma.matchAssist.deleteMany({});

  // 2. Tüm tahminleri ve kullanıcıların hesaplanan puanlarını sil
  await prisma.userScore.deleteMany({});
  await prisma.predictionGoalScorer.deleteMany({});
  await prisma.predictionAssist.deleteMany({});
  await prisma.prediction.deleteMany({});

  // 3. Maçları "Oynanmadı" durumuna geri getir
  await prisma.match.updateMany({
    data: {
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
      motmPlayerId: null,
    }
  });

  // 4. Admin hariç tüm kullanıcıları sil
  await prisma.user.deleteMany({
    where: {
      username: { not: 'admin' }
    }
  });

  console.log("Her şey sıfırlandı! Sadece maçlar ve admin hesabı kaldı.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
