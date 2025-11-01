import Stripe from "stripe";
import { userMapping } from "./store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export async function getOrCreateCustomer(
  githubHandle: string
): Promise<string> {
  // Check if there's a mapped customer ID
  const mappedCustomerId = await userMapping.get(githubHandle);
  if (mappedCustomerId) {
    return mappedCustomerId;
  }

  // Fall back to old behavior: search or create by email
  const email = `${githubHandle}@example.dev`;

  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: githubHandle,
    description: `GitHub contributor: ${githubHandle}`,
  });

  return customer.id;
}

export async function creditCustomerBalance(
  customerId: string,
  cents: number,
  description: string
): Promise<Stripe.CustomerBalanceTransaction> {
  // Balance transactions use negative amounts to represent credits
  const transaction = await stripe.customers.createBalanceTransaction(
    customerId,
    {
      amount: -cents, // negative = credit
      currency: "usd",
      description,
    }
  );

  return transaction;
}
