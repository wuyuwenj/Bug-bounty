import { prisma } from "../lib/db";
import { startGreptileReview } from "../lib/greptile";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, for higher rate limits
const OWNER = process.env.GITHUB_OWNER || "wuyuwenj";
const REPO = process.env.GITHUB_REPO || "customerAI";

async function fetchPRsFromGitHub(owner: string, repo: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (GITHUB_TOKEN) {
    // Fine-grained tokens use "Bearer", classic tokens use "token"
    headers.Authorization = GITHUB_TOKEN.startsWith("github_pat_")
      ? `Bearer ${GITHUB_TOKEN}`
      : `token ${GITHUB_TOKEN}`;

    console.log(`Using GitHub token: ${GITHUB_TOKEN.substring(0, 20)}...`);
  } else {
    console.log("No GitHub token provided, using unauthenticated requests");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
    { headers }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`GitHub API Response: ${errorBody}`);
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}\n` +
      `Make sure the repo "${owner}/${repo}" exists and is accessible.\n` +
      `If it's private, make sure your GITHUB_TOKEN has the correct permissions.`
    );
  }

  return response.json();
}

async function importPRs() {
  console.log(`Fetching PRs from ${OWNER}/${REPO}...`);

  try {
    const prs = await fetchPRsFromGitHub(OWNER, REPO);

    console.log(`Found ${prs.length} PRs. Importing...`);

    for (const pr of prs) {
      const prId = `${OWNER}/${REPO}#${pr.number}`;

      // Check if PR already exists
      const existing = await prisma.pullRequest.findUnique({
        where: { prId },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${prId} (already exists)`);
        continue;
      }

      // Start Greptile review
      console.log(`📝 Starting review for ${prId}...`);
      const reviewId = await startGreptileReview(OWNER, REPO, pr.number);

      // Create PR in database
      await prisma.pullRequest.create({
        data: {
          prId,
          title: pr.title,
          author: pr.user.login,
          status: "reviewing",
          repo: REPO,
          owner: OWNER,
          prNumber: pr.number,
          greptileReviewId: reviewId,
        },
      });

      console.log(`✅ Imported ${prId}`);
    }

    console.log(`\n🎉 Import complete! Imported ${prs.length} PRs.`);
    console.log(
      `Visit http://localhost:3000 to see them in the dashboard.`
    );
  } catch (error) {
    console.error("Error importing PRs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importPRs();
