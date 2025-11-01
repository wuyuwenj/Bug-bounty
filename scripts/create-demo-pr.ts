import "dotenv/config";
import { prisma } from "../lib/db";

const demoGreptileReview = {
  id: "greptile-demo-review",
  status: "completed",
  score: 100,
  summary: "Excellent code quality with well-structured refactoring and comprehensive documentation.",
  message: `# Greptile Overview

## Greptile Summary
This PR introduces two temporary test markdown files (sample-test.md and test-file.md) and refactors the dashboard component in the CustomerAI application. The test files are explicitly created for validating the PR workflow, webhook integration, and branch management processes - they contain only documentation content with no functional impact. The main substantive change is a code quality improvement in the dashboard page, where inline statistics calculations and repetitive Card components were extracted into reusable calculateDashboardStats helper function and StatCard component. This refactoring eliminates code duplication while maintaining identical functionality, improving maintainability and testability of the dashboard without changing any business logic or user-facing behavior.

## Important Files Changed

### sample-test.md
**Score: 5/5**
Added temporary test file for PR workflow validation with basic markdown documentation

### test-file.md
**Score: 5/5**
Added temporary test file for webhook integration and branch testing with documentation content

### src/app/(protected)/dashboard/page.tsx
**Score: 5/5**
Refactored dashboard component to extract reusable StatCard component and calculateDashboardStats helper function

## Confidence score: 5/5

✅ This PR is safe to merge with minimal risk as it contains only temporary test files and code quality improvements

Score reflects simple, well-structured changes with no breaking functionality - the test files have zero production impact and the dashboard refactor maintains identical behavior while improving code organization

No files require special attention as all changes are either temporary test files or straightforward refactoring with preserved functionality`,
  issues: [],
  details: {
    codeQuality: "Excellent refactoring with proper component extraction",
    bestPractices: "Follows React and TypeScript best practices",
    security: "No security concerns",
    performance: "No performance impact",
    maintainability: "Significantly improved maintainability",
    suggestions: [
      "Consider adding unit tests for the new StatCard component",
      "Document the calculateDashboardStats function"
    ],
    positives: [
      "Clean code refactoring",
      "Proper component extraction",
      "Well-structured helper functions",
      "No breaking changes"
    ]
  }
};

async function createDemoPR() {
  console.log("🎬 Creating demo PR with Greptile review...\n");

  const demoPR = {
    prId: "wuyuwenj/customerAI#5",
    title: "Refactor: Dashboard improvements",
    author: "wuyuwenj",
    status: "pass",
    repo: "customerAI",
    owner: "wuyuwenj",
    prNumber: 5,
    greptileReviewId: "greptile-demo-review",
    greptileReview: demoGreptileReview,
    notes: `Score: 100/100. ${demoGreptileReview.summary}`,
  };

  await prisma.pullRequest.upsert({
    where: { prId: demoPR.prId },
    create: demoPR,
    update: demoPR,
  });

  console.log("✅ Demo PR created: wuyuwenj/customerAI#5");
  console.log("📊 Score: 100/100");
  console.log("✅ Status: pass");
  console.log("\nView it on your dashboard at http://localhost:3000");

  await prisma.$disconnect();
}

createDemoPR();
