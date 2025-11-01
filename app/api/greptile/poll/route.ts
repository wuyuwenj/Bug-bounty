import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getGreptileReviewStatus, computeVerdict } from "@/lib/greptile";

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

    if (!pr.greptileReviewId) {
      return NextResponse.json(
        { error: "No review ID found for this PR" },
        { status: 400 }
      );
    }

    // Fetch review status from Greptile
    const review = await getGreptileReviewStatus(pr.greptileReviewId);

    if (review.status === "pending") {
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
