export type PRStatus = "reviewing" | "pass" | "fail" | "credited" | "error";

export interface PRItem {
  id: string; // owner/repo#pr
  title: string;
  author: string;
  status: PRStatus;
  greptileReviewId?: string;
  notes?: string;
  creditedAmount?: number;
  customerId?: string;
  updatedAt: Date;
  repo: string;
  owner: string;
  prNumber: number;
}

// In-memory store
const prStore = new Map<string, PRItem>();

// GitHub username to Stripe customer ID mapping
const userMappingStore = new Map<string, string>();

export const store = {
  set(id: string, data: PRItem) {
    prStore.set(id, { ...data, updatedAt: new Date() });
  },

  get(id: string): PRItem | undefined {
    return prStore.get(id);
  },

  update(id: string, updates: Partial<PRItem>) {
    const existing = prStore.get(id);
    if (existing) {
      prStore.set(id, { ...existing, ...updates, updatedAt: new Date() });
    }
  },

  getAll(): PRItem[] {
    return Array.from(prStore.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  },

  delete(id: string) {
    prStore.delete(id);
  },
};

// User mapping store
export const userMapping = {
  set(githubUsername: string, stripeCustomerId: string) {
    userMappingStore.set(githubUsername.toLowerCase(), stripeCustomerId);
  },

  get(githubUsername: string): string | undefined {
    return userMappingStore.get(githubUsername.toLowerCase());
  },

  getAll(): Array<{ githubUsername: string; stripeCustomerId: string }> {
    return Array.from(userMappingStore.entries()).map(([username, customerId]) => ({
      githubUsername: username,
      stripeCustomerId: customerId,
    }));
  },

  delete(githubUsername: string) {
    userMappingStore.delete(githubUsername.toLowerCase());
  },
};
