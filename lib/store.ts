import { prisma } from "./db";

export type PRStatus = "reviewing" | "pass" | "fail" | "credited" | "error";

export interface PRItem {
  id: string; // owner/repo#pr
  title: string;
  author: string;
  status: PRStatus;
  greptileReviewId?: string;
  greptileReview?: any; // Full Greptile review object
  notes?: string;
  creditedAmount?: number;
  customerId?: string;
  updatedAt: Date;
  repo: string;
  owner: string;
  prNumber: number;
}

// Store interface using Prisma
export const store = {
  async set(id: string, data: PRItem) {
    await prisma.pullRequest.upsert({
      where: { prId: id },
      create: {
        prId: id,
        title: data.title,
        author: data.author,
        status: data.status,
        repo: data.repo,
        owner: data.owner,
        prNumber: data.prNumber,
        greptileReviewId: data.greptileReviewId,
        greptileReview: data.greptileReview,
        notes: data.notes,
        creditedAmount: data.creditedAmount,
        customerId: data.customerId,
      },
      update: {
        title: data.title,
        author: data.author,
        status: data.status,
        repo: data.repo,
        owner: data.owner,
        prNumber: data.prNumber,
        greptileReviewId: data.greptileReviewId,
        greptileReview: data.greptileReview,
        notes: data.notes,
        creditedAmount: data.creditedAmount,
        customerId: data.customerId,
      },
    });
  },

  async get(id: string): Promise<PRItem | undefined> {
    const pr = await prisma.pullRequest.findUnique({
      where: { prId: id },
    });

    if (!pr) return undefined;

    return {
      id: pr.prId,
      title: pr.title,
      author: pr.author,
      status: pr.status as PRStatus,
      repo: pr.repo,
      owner: pr.owner,
      prNumber: pr.prNumber,
      greptileReviewId: pr.greptileReviewId || undefined,
      greptileReview: pr.greptileReview || undefined,
      notes: pr.notes || undefined,
      creditedAmount: pr.creditedAmount || undefined,
      customerId: pr.customerId || undefined,
      updatedAt: pr.updatedAt,
    };
  },

  async update(id: string, updates: Partial<PRItem>) {
    await prisma.pullRequest.update({
      where: { prId: id },
      data: {
        title: updates.title,
        author: updates.author,
        status: updates.status,
        repo: updates.repo,
        owner: updates.owner,
        prNumber: updates.prNumber,
        greptileReviewId: updates.greptileReviewId,
        greptileReview: updates.greptileReview,
        notes: updates.notes,
        creditedAmount: updates.creditedAmount,
        customerId: updates.customerId,
      },
    });
  },

  async getAll(): Promise<PRItem[]> {
    const prs = await prisma.pullRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return prs.map((pr) => ({
      id: pr.prId,
      title: pr.title,
      author: pr.author,
      status: pr.status as PRStatus,
      repo: pr.repo,
      owner: pr.owner,
      prNumber: pr.prNumber,
      greptileReviewId: pr.greptileReviewId || undefined,
      greptileReview: pr.greptileReview || undefined,
      notes: pr.notes || undefined,
      creditedAmount: pr.creditedAmount || undefined,
      customerId: pr.customerId || undefined,
      updatedAt: pr.updatedAt,
    }));
  },

  async delete(id: string) {
    await prisma.pullRequest.delete({
      where: { prId: id },
    });
  },
};

// User mapping store using Prisma
export const userMapping = {
  async set(githubUsername: string, stripeCustomerId: string) {
    await prisma.userMapping.upsert({
      where: { githubUsername: githubUsername.toLowerCase() },
      create: {
        githubUsername: githubUsername.toLowerCase(),
        stripeCustomerId,
      },
      update: {
        stripeCustomerId,
      },
    });
  },

  async get(githubUsername: string): Promise<string | undefined> {
    const mapping = await prisma.userMapping.findUnique({
      where: { githubUsername: githubUsername.toLowerCase() },
    });
    return mapping?.stripeCustomerId;
  },

  async getAll(): Promise<Array<{ githubUsername: string; stripeCustomerId: string }>> {
    const mappings = await prisma.userMapping.findMany({
      orderBy: { createdAt: "desc" },
    });
    return mappings.map((m) => ({
      githubUsername: m.githubUsername,
      stripeCustomerId: m.stripeCustomerId,
    }));
  },

  async delete(githubUsername: string) {
    await prisma.userMapping.delete({
      where: { githubUsername: githubUsername.toLowerCase() },
    });
  },
};
