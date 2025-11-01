-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "greptileReviewId" TEXT,
    "greptileReview" JSONB,
    "notes" TEXT,
    "creditedAmount" INTEGER,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMapping" (
    "id" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_prId_key" ON "PullRequest"("prId");

-- CreateIndex
CREATE INDEX "PullRequest_author_idx" ON "PullRequest"("author");

-- CreateIndex
CREATE INDEX "PullRequest_status_idx" ON "PullRequest"("status");

-- CreateIndex
CREATE INDEX "PullRequest_createdAt_idx" ON "PullRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMapping_githubUsername_key" ON "UserMapping"("githubUsername");

-- CreateIndex
CREATE INDEX "UserMapping_githubUsername_idx" ON "UserMapping"("githubUsername");
