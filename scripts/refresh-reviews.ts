import "dotenv/config";
import { prisma } from "../lib/db";
import { startGreptileReview } from "../lib/greptile";

async function refreshReviews() {
  console.log("🔄 Refreshing Greptile reviews for all PRs...\n");

  const prs = await prisma.pullRequest.findMany();

  console.log(`Found ${prs.length} PRs to refresh\n`);

  for (const pr of prs) {
    console.log(`\n📝 Refreshing review for ${pr.prId}...`);

    try {
      // Start new Greptile review
      const reviewId = await startGreptileReview(pr.owner, pr.repo, pr.prNumber);

      // Update database with new review ID
      await prisma.pullRequest.update({
        where: { id: pr.id },
        data: {
          greptileReviewId: reviewId,
          status: "reviewing",
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Updated ${pr.prId} with review ID: ${reviewId}`);
    } catch (error) {
      console.error(`❌ Error refreshing ${pr.prId}:`, error);
    }
  }

  console.log("\n🎉 All reviews refreshed!");
  await prisma.$disconnect();
}

refreshReviews();
