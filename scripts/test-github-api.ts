import "dotenv/config";

async function testGitHubAPI() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const owner = "wuyuwenj";
  const repo = "customerAI";
  const prNumber = 7;

  console.log("GitHub Token:", GITHUB_TOKEN ? `${GITHUB_TOKEN.substring(0, 20)}...` : "MISSING");

  // Test issue comments
  console.log("\n=== Testing Issue Comments ===");
  const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  console.log("URL:", commentsUrl);

  try {
    const response = await fetch(commentsUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log("Status:", response.status, response.statusText);

    const data = await response.json();

    if (Array.isArray(data)) {
      console.log(`\nFound ${data.length} issue comments`);
      data.forEach((comment: any, i: number) => {
        console.log(`\nComment ${i + 1}:`);
        console.log(`  User: ${comment.user?.login}`);
        console.log(`  Body preview: ${comment.body?.substring(0, 100)}...`);
      });

      const greptileComment = data.find(
        (comment: any) => comment.user?.login === "greptile-apps[bot]"
      );

      if (greptileComment) {
        console.log("\n✅ Found Greptile bot in issue comments!");
      } else {
        console.log("\n❌ No Greptile bot in issue comments");
      }
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
  }

  // Test PR reviews
  console.log("\n\n=== Testing PR Reviews ===");
  const reviewsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
  console.log("URL:", reviewsUrl);

  try {
    const response = await fetch(reviewsUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log("Status:", response.status, response.statusText);

    const data = await response.json();

    if (Array.isArray(data)) {
      console.log(`\nFound ${data.length} reviews`);
      data.forEach((review: any, i: number) => {
        console.log(`\nReview ${i + 1}:`);
        console.log(`  User: ${review.user?.login}`);
        console.log(`  State: ${review.state}`);
        console.log(`  Body preview: ${review.body?.substring(0, 100)}...`);
      });

      const greptileReview = data.find(
        (review: any) => review.user?.login === "greptile-apps[bot]"
      );

      if (greptileReview) {
        console.log("\n✅ Found Greptile bot review!");
        console.log("\nFull review body:\n");
        console.log(greptileReview.body);
      } else {
        console.log("\n❌ No Greptile bot review found");
      }
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

testGitHubAPI();
