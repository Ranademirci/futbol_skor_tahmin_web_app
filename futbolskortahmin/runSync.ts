import { syncFixtures, syncPlayers } from './src/lib/api-football/sync';
import { BIG_FOUR_API_IDS, CURRENT_SEASON } from './src/lib/constants';

async function main() {
  console.log("Maçlar çekiliyor...");
  const fixtures = await syncFixtures(2024);
  console.log("Maçlar güncellendi:", fixtures);
  
  console.log("4 Büyüklerin oyuncuları çekiliyor...");
  let totalPlayers = 0;
  for (const teamId of BIG_FOUR_API_IDS) {
    totalPlayers += await syncPlayers(teamId, 2024);
    console.log(`Takım ${teamId} için oyuncular çekildi.`);
  }
  console.log(`Toplam ${totalPlayers} oyuncu güncellendi.`);
}

main().catch(console.error);
