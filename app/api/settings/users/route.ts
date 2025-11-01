import { NextRequest, NextResponse } from "next/server";
import { userMapping } from "@/lib/store";

export async function GET() {
  try {
    const users = await userMapping.getAll();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { githubUsername, stripeCustomerId } = await req.json();

    if (!githubUsername || !stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing githubUsername or stripeCustomerId" },
        { status: 400 }
      );
    }

    // Validate Stripe customer ID format
    if (!stripeCustomerId.startsWith("cus_")) {
      return NextResponse.json(
        { error: "Invalid Stripe customer ID format (must start with 'cus_')" },
        { status: 400 }
      );
    }

    await userMapping.set(githubUsername, stripeCustomerId);

    return NextResponse.json({
      success: true,
      message: `Mapped ${githubUsername} to ${stripeCustomerId}`,
    });
  } catch (error) {
    console.error("Error creating user mapping:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { githubUsername } = await req.json();

    if (!githubUsername) {
      return NextResponse.json(
        { error: "Missing githubUsername" },
        { status: 400 }
      );
    }

    await userMapping.delete(githubUsername);

    return NextResponse.json({
      success: true,
      message: `Deleted mapping for ${githubUsername}`,
    });
  } catch (error) {
    console.error("Error deleting user mapping:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
