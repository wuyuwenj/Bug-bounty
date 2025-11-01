import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";
import { computeVerdict } from "@/lib/greptile";
import { getOrCreateCustomer, creditCustomerBalance } from "@/lib/stripe";
import type { GreptileReview } from "@/lib/greptile";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

function parseGreptileComment(commentBody: string): GreptileReview | null {
  try {
    // Extract confidence score
    const scoreMatch = commentBody.match(/Confidence score:\s*(\d+)\/5/i);
    const confidenceScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Convert 5-point scale to 100-point scale
    const score = Math.round((confidenceScore / 5) * 100);

    // Extract summary
    const summaryMatch = commentBody.match(/Greptile Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "Review completed";

    // Extract important files
    const filesSection = commentBody.match(/Important Files Changed([\s\S]*?)(?=\n##|Confidence score|$)/i);
    const issues = [];

    if (filesSection) {
      const fileMatches = filesSection[1].matchAll(/Filename.*?\n.*?Score.*?(\d+)\/5.*?\nOverview.*?\n(.*?)(?=\n|$)/gi);
      for (const match of fileMatches) {
        const fileScore = parseInt(match[1]);
        const overview = match[2].trim();

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

    const review: GreptileReview = {
      id: `greptile-comment-${Date.now()}`,
      status: "completed",
      score,
      summary,
      message: commentBody,
      issues: issues.length > 0 ? issues : undefined,
    };

    // Compute verdict
    const verdict = computeVerdict(review);

    return { ...review, status: verdict };
  } catch (error) {
    console.error("Error parsing Greptile comment:", error);
    return null;
  }
}

function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";

    // Verify signature
    if (!verifySignature(payload, signature)) {
      console.warn("Invalid webhook signature");
      // In development, allow unsigned requests
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    const action = event.action;

    // Log all webhook events for debugging
    console.log(`📨 Webhook received: action=${action}`);
    if (event.comment) {
      console.log(`💬 Comment from: ${event.comment.user?.login}`);
    }
    if (event.review) {
      console.log(`📝 Review from: ${event.review.user?.login}`);
    }

    // Handle Greptile bot comments on PRs (issue_comment events)
    if (action === "created" && event.comment && event.issue?.pull_request) {
      const comment = event.comment;
      const commenter = comment.user?.login;

      // Check if comment is from Greptile bot
      if (commenter === "greptile-apps[bot]") {
        console.log("🤖 Greptile bot comment detected!");

        const prNumber = event.issue.number;
        const repo = event.repository;
        const owner = repo.owner.login;
        const repoName = repo.name;
        const id = `${owner}/${repoName}#${prNumber}`;

        // Parse the Greptile review from comment body
        const reviewData = parseGreptileComment(comment.body);

        if (reviewData) {
          console.log(`📊 Parsed review for ${id}:`, reviewData);

          const verdict = reviewData.status as "pass" | "fail";

          // Update PR with review data
          await store.update(id, {
            status: verdict,
            greptileReview: reviewData,
            notes: `Score: ${reviewData.score}/100. ${reviewData.summary}`,
          });

          // If review passed, credit Stripe customer
          if (verdict === "pass") {
            try {
              const pr = await store.get(id);
              if (pr) {
                console.log(`💳 Review passed! Crediting ${pr.author}...`);

                const customerId = await getOrCreateCustomer(pr.author);
                await creditCustomerBalance(
                  customerId,
                  500, // $5.00 in cents
                  `PR bonus for ${id}`
                );

                console.log(`✅ Credited $5 to ${pr.author}`);
              }
            } catch (error) {
              console.error("Error crediting Stripe:", error);
              // Don't fail the webhook if Stripe fails
            }
          }

          return NextResponse.json({
            success: true,
            message: `Review received for ${id}`,
            review: reviewData,
            verdict,
          });
        }
      }
    }

    // Handle PR events
    if (action === "opened" || action === "synchronize" || action === "reopened") {
      const pr = event.pull_request;
      const repo = event.repository;

      const owner = repo.owner.login;
      const repoName = repo.name;
      const prNumber = pr.number;
      const id = `${owner}/${repoName}#${prNumber}`;

      console.log(`✅ PR webhook received: ${id}`);

      // Store PR info (Greptile will review automatically via GitHub integration)
      await store.set(id, {
        id,
        title: pr.title,
        author: pr.user.login,
        status: "reviewing",
        repo: repoName,
        owner,
        prNumber,
        updatedAt: new Date(),
      });

      console.log(`📝 PR ${id} created with status "reviewing". Waiting for Greptile bot to comment...`);

      return NextResponse.json({
        success: true,
        message: `PR ${id} is being tracked. Waiting for Greptile review.`,
      });
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
