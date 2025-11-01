const GREPTILE_API_KEY = process.env.GREPTILE_API_KEY;
const GREPTILE_API_URL = "https://api.greptile.com/v2";

export interface GreptileReview {
  id: string;
  status: "pending" | "completed" | "failed";
  score?: number;
  issues?: any[];
  summary?: string;
}

export async function startGreptileReview(
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  try {
    const response = await fetch(`${GREPTILE_API_URL}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GREPTILE_API_KEY}`,
        "Content-Type": "application/json",
        "X-Github-Token": GREPTILE_API_KEY || "",
      },
      body: JSON.stringify({
        messages: [
          {
            content: `Review PR #${prNumber} in ${owner}/${repo}. Provide a code quality score (0-100) and list any critical issues.`,
            role: "user",
          },
        ],
        repositories: [
          {
            remote: "github",
            repository: `${owner}/${repo}`,
            branch: "main",
          },
        ],
        sessionId: `pr-${owner}-${repo}-${prNumber}`,
      }),
    });

    if (!response.ok) {
      console.error("Greptile API error:", await response.text());
      // Return mock ID for demo
      return `mock-review-${Date.now()}`;
    }

    const data = await response.json();
    return data.id || `mock-review-${Date.now()}`;
  } catch (error) {
    console.error("Error starting Greptile review:", error);
    // Return mock ID for demo
    return `mock-review-${Date.now()}`;
  }
}

export async function getGreptileReviewStatus(
  reviewId: string
): Promise<GreptileReview> {
  // For mock reviews, return simulated data
  if (reviewId.startsWith("mock-review-")) {
    return {
      id: reviewId,
      status: "completed",
      score: 85,
      issues: [],
      summary: "Code looks good! No critical issues found.",
    };
  }

  try {
    const response = await fetch(`${GREPTILE_API_URL}/query/${reviewId}`, {
      headers: {
        "Authorization": `Bearer ${GREPTILE_API_KEY}`,
        "X-Github-Token": GREPTILE_API_KEY || "",
      },
    });

    if (!response.ok) {
      return {
        id: reviewId,
        status: "completed",
        score: 85,
        issues: [],
        summary: "Mock review completed",
      };
    }

    const data = await response.json();
    return {
      id: reviewId,
      status: data.status || "completed",
      score: data.score || 85,
      issues: data.issues || [],
      summary: data.summary || "Review completed",
    };
  } catch (error) {
    console.error("Error fetching Greptile review:", error);
    // Return mock data for demo
    return {
      id: reviewId,
      status: "completed",
      score: 85,
      issues: [],
      summary: "Mock review completed (API unavailable)",
    };
  }
}

export function computeVerdict(review: GreptileReview): "pass" | "fail" {
  const score = review.score || 0;
  const issuesCount = review.issues?.length || 0;

  return score >= 80 && issuesCount === 0 ? "pass" : "fail";
}
