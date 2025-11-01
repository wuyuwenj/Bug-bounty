import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";
import { startGreptileReview } from "@/lib/greptile";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

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

    // Handle PR events
    if (action === "opened" || action === "synchronize" || action === "reopened") {
      const pr = event.pull_request;
      const repo = event.repository;

      const owner = repo.owner.login;
      const repoName = repo.name;
      const prNumber = pr.number;
      const id = `${owner}/${repoName}#${prNumber}`;

      console.log(`Processing PR: ${id}`);

      // Start Greptile review
      const reviewId = await startGreptileReview(owner, repoName, prNumber);

      // Store PR info
      await store.set(id, {
        id,
        title: pr.title,
        author: pr.user.login,
        status: "reviewing",
        greptileReviewId: reviewId,
        repo: repoName,
        owner,
        prNumber,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `PR ${id} is now being reviewed`,
        reviewId,
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
