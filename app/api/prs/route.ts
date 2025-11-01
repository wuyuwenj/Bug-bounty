import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const prs = store.getAll();
    return NextResponse.json({ success: true, prs });
  } catch (error) {
    console.error("Error fetching PRs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
