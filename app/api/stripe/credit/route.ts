import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getOrCreateCustomer, creditCustomerBalance } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { id, cents = 500 } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing PR id" }, { status: 400 });
    }

    const pr = store.get(id);
    if (!pr) {
      return NextResponse.json({ error: "PR not found" }, { status: 404 });
    }

    if (pr.status !== "pass") {
      return NextResponse.json(
        { error: "PR must have 'pass' status to receive credit" },
        { status: 400 }
      );
    }

    if (pr.status === "credited") {
      return NextResponse.json(
        { error: "Credit already issued for this PR" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(pr.author);

    // Credit the balance
    const transaction = await creditCustomerBalance(
      customerId,
      cents,
      `PR bonus: ${pr.id} - ${pr.title}`
    );

    // Update store
    store.update(id, {
      status: "credited",
      customerId,
      creditedAmount: cents,
      notes: `${pr.notes || ""}\nCredited $${(cents / 100).toFixed(2)} to customer ${customerId}`,
    });

    return NextResponse.json({
      success: true,
      customerId,
      amount: cents,
      transactionId: transaction.id,
      message: `Credited $${(cents / 100).toFixed(2)} to ${pr.author}`,
    });
  } catch (error) {
    console.error("Credit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
