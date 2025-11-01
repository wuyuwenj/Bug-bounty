import "dotenv/config";
import { prisma } from "../lib/db";

async function resetPRs() {
  console.log("🗑️  Deleting all PRs from database...\n");

  const result = await prisma.pullRequest.deleteMany({});

  console.log(`✅ Deleted ${result.count} PRs`);
  console.log("\nNow run: npm run import-prs\n");

  await prisma.$disconnect();
}

resetPRs();
