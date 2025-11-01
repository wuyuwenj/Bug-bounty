import "dotenv/config";
import { prisma } from "../lib/db";

async function checkDB() {
  const prs = await prisma.pullRequest.findMany();
  console.log(`Found ${prs.length} PRs in database:`);
  prs.forEach(pr => {
    console.log(`\n${pr.prId}:`, JSON.stringify(pr, null, 2));
  });

  await prisma.$disconnect();
}

checkDB();
