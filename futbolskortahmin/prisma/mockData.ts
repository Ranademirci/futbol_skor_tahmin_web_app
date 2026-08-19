import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const galatasaray = await prisma.team.findUnique({ where: { name: 'Galatasaray' } })
  const fenerbahce = await prisma.team.findUnique({ where: { name: 'Fenerbahçe' } })
  const besiktas = await prisma.team.findUnique({ where: { name: 'Beşiktaş' } })
  const trabzonspor = await prisma.team.findUnique({ where: { name: 'Trabzonspor' } })

  if (!galatasaray || !fenerbahce || !besiktas || !trabzonspor) {
    console.log("Takımlar bulunamadı!")
    return
  }

  // Yarına bir Derbi Maçı
  const kickoffTomorrow = new Date()
  kickoffTomorrow.setDate(kickoffTomorrow.getDate() + 1)
  kickoffTomorrow.setHours(20, 0, 0, 0)

  // 2 Gün sonraya normal bir maç (4 Büyük vs Diğer takım - diğer takımı da oluşturalım)
  const kayserispor = await prisma.team.upsert({
    where: { name: 'Kayserispor' },
    update: {},
    create: { name: 'Kayserispor', shortName: 'KAY', isBigFour: false, apiFootballId: 1001 }
  })

  const kickoffAfterTomorrow = new Date()
  kickoffAfterTomorrow.setDate(kickoffAfterTomorrow.getDate() + 2)
  kickoffAfterTomorrow.setHours(19, 0, 0, 0)

  // 1 Saat önce başlamış maç (Kilitli durum testi için)
  const kickoffPast = new Date()
  kickoffPast.setHours(kickoffPast.getHours() - 1)

  await prisma.match.create({
    data: {
      season: '2025',
      week: 1,
      homeTeamId: galatasaray.id,
      awayTeamId: fenerbahce.id,
      kickoffTime: kickoffTomorrow,
      isDerby: true,
      status: 'SCHEDULED',
      apiFixtureId: 9001
    }
  })

  await prisma.match.create({
    data: {
      season: '2025',
      week: 1,
      homeTeamId: besiktas.id,
      awayTeamId: kayserispor.id,
      kickoffTime: kickoffAfterTomorrow,
      isDerby: false,
      status: 'SCHEDULED',
      apiFixtureId: 9002
    }
  })

  await prisma.match.create({
    data: {
      season: '2025',
      week: 1,
      homeTeamId: trabzonspor.id,
      awayTeamId: galatasaray.id, // Trabzonspor vs GS, ama başlamış
      kickoffTime: kickoffPast,
      isDerby: true,
      status: 'LIVE',
      homeScore: 1,
      awayScore: 0,
      apiFixtureId: 9003
    }
  })

  // Örnek oyuncular (Tahmin formunda seçmek için)
  await prisma.player.createMany({
    data: [
      { name: 'Mauro Icardi', position: 'Attacker', teamId: galatasaray.id, apiFootballId: 8001 },
      { name: 'Barış Alper Yılmaz', position: 'Midfielder', teamId: galatasaray.id, apiFootballId: 8002 },
      { name: 'Edin Dzeko', position: 'Attacker', teamId: fenerbahce.id, apiFootballId: 8003 },
      { name: 'Dusan Tadic', position: 'Midfielder', teamId: fenerbahce.id, apiFootballId: 8004 },
      { name: 'Ciro Immobile', position: 'Attacker', teamId: besiktas.id, apiFootballId: 8005 },
      { name: 'Rafa Silva', position: 'Midfielder', teamId: besiktas.id, apiFootballId: 8006 },
    ]
  })

  console.log("Örnek maçlar ve oyuncular eklendi!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
