import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { computeVerdict } from "@/lib/greptile";
import type { GreptileReview } from "@/lib/greptile";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function parseGreptileComment(commentBody: string): GreptileReview | null {
  try {
    // Extract confidence score (supports both markdown and HTML format)
    const scoreMatch = commentBody.match(/Confidence score:\s*(\d+)\/5/i);
    const confidenceScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Convert 5-point scale to 100-point scale
    const score = Math.round((confidenceScore / 5) * 100);

    // Extract summary (handle both markdown ## and HTML <h3>)
    const summaryMatch = commentBody.match(/(?:Greptile Summary|<h3>Greptile Summary<\/h3>)[\s\S]*?(?:<\/h3>)?\s*([\s\S]*?)(?=<h3>|###|Important Files|Confidence score|$)/i);
    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, "").trim() : "Review completed";

    // Extract important files from table (handle both markdown and HTML)
    const filesSection = commentBody.match(/Important Files Changed[\s\S]*?(\|[\s\S]*?\|[\s\S]*?\n[\s\S]*?)(?=<h3>|###|Confidence score|$)/i);
    const issues = [];

    if (filesSection) {
      // Parse markdown table rows
      const rows = filesSection[1].split("\n").filter(line => line.includes("|") && !line.includes("---"));
      for (const row of rows) {
        const cells = row.split("|").map(c => c.trim()).filter(Boolean);
        if (cells.length >= 3 && cells[1].includes("/5")) {
          const scoreText = cells[1].match(/(\d+)\/5/);
          if (scoreText) {
            const fileScore = parseInt(scoreText[1]);
            const overview = cells[2];

            // Flag low scores as issues
            if (fileScore < 4) {
              issues.push({
                type: "warning" as const,
                severity: fileScore < 3 ? "moderate" as const : "minor" as const,
                message: overview,
              });
            }
          }
        }
      }
    }

    const review: GreptileReview = {
      id: `greptile-comment-${Date.now()}`,
      status: "completed",
      score,
      summary: summary.substring(0, 500), // Limit summary length
      message: commentBody,
      issues: issues.length > 0 ? issues : undefined,
    };

    return review;
  } catch (error) {
    console.error("Error parsing Greptile comment:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing PR id" }, { status: 400 });
    }

    const pr = await store.get(id);
    if (!pr) {
      return NextResponse.json({ error: "PR not found" }, { status: 404 });
    }

    // Fetch both issue comments and PR reviews from GitHub
    const [commentsResponse, reviewsResponse] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${pr.owner}/${pr.repo}/issues/${pr.prNumber}/comments`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      ),
      fetch(
        `https://api.github.com/repos/${pr.owner}/${pr.repo}/pulls/${pr.prNumber}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      ),
    ]);

    let greptileContent = null;

    // Check issue comments
    if (commentsResponse.ok) {
      const comments = await commentsResponse.json();
      const greptileComment = comments.find(
        (comment: any) => comment.user?.login === "greptile-apps[bot]"
      );
      if (greptileComment) {
        greptileContent = greptileComment.body;
      }
    }

    // Check PR reviews if not found in comments
    if (!greptileContent && reviewsResponse.ok) {
      const reviews = await reviewsResponse.json();
      const greptileReview = reviews.find(
        (review: any) => review.user?.login === "greptile-apps[bot]"
      );
      if (greptileReview?.body) {
        greptileContent = greptileReview.body;
      }
    }

    if (!greptileContent) {
      return NextResponse.json({
        success: true,
        status: "reviewing",
        message: "Review still in progress - waiting for Greptile bot",
      });
    }

    // Parse the Greptile review from content
    const review = parseGreptileComment(greptileContent);

    if (!review) {
      return NextResponse.json({
        success: true,
        status: "reviewing",
        message: "Review still in progress",
      });
    }

    // Compute verdict
    const verdict = computeVerdict(review);

    // Update store with full review data
    await store.update(id, {
      status: verdict,
      notes: `Score: ${review.score}/100. ${review.summary || ""}`,
      greptileReview: review, // Save full review for detail page
    });

    return NextResponse.json({
      success: true,
      status: verdict,
      review: {
        score: review.score,
        issues: review.issues?.length || 0,
        summary: review.summary,
      },
    });
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
