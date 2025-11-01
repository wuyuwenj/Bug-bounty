import "dotenv/config";
import { startGreptileReview, getGreptileReviewStatus } from "../lib/greptile";

async function testGreptile() {
  const OWNER = "wuyuwenj";
  const REPO = "customerAI";
  const PR_NUMBER = 3; // Test with an existing PR

  console.log("🧪 Testing Greptile API integration...\n");

  // Start a review
  console.log("Step 1: Starting Greptile review...");
  const reviewId = await startGreptileReview(OWNER, REPO, PR_NUMBER);
  console.log(`\n✅ Review started with ID: ${reviewId}\n`);

  // Wait a bit for processing
  console.log("⏳ Waiting 5 seconds for Greptile to process...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get review status
  console.log("Step 2: Fetching review status...");
  const review = await getGreptileReviewStatus(reviewId);
  console.log("\n📊 Review Result:");
  console.log(JSON.stringify(review, null, 2));
}

testGreptile().catch(console.error);
