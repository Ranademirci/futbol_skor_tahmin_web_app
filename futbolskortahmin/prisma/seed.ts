import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Demo user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
    },
  })
  
  console.log({ user })

  // Teams
  const teamsData = [
    { name: 'Galatasaray', shortName: 'GAL', isBigFour: true, apiFootballId: 645 },
    { name: 'Fenerbahçe', shortName: 'FEN', isBigFour: true, apiFootballId: 611 },
    { name: 'Beşiktaş', shortName: 'BES', isBigFour: true, apiFootballId: 549 },
    { name: 'Trabzonspor', shortName: 'TRA', isBigFour: true, apiFootballId: 556 },
  ]

  for (const teamData of teamsData) {
    const team = await prisma.team.upsert({
      where: { name: teamData.name },
      update: {},
      create: teamData,
    })
    console.log({ team })
  }
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
