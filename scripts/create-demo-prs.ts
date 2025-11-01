import "dotenv/config";
import { prisma } from "../lib/db";

async function createDemoPRs() {
  // PR #5 - Perfect score (PASS)
  await prisma.pullRequest.upsert({
    where: { prId: "wuyuwenj/customerAI#5" },
    create: {
      prId: "wuyuwenj/customerAI#5",
      title: "Refactor: Dashboard improvements",
      author: "wuyuwenj",
      status: "pass",
      repo: "customerAI",
      owner: "wuyuwenj",
      prNumber: 5,
      greptileReviewId: "greptile-demo-review-5",
      greptileReview: {
        id: "greptile-demo-review-5",
        status: "completed",
        score: 100,
        summary: "Excellent code quality with well-structured refactoring and comprehensive documentation.",
        message: `# Greptile Overview

## Greptile Summary
This PR introduces two temporary test markdown files (sample-test.md and test-file.md) and refactors the dashboard component in the CustomerAI application. The test files are explicitly created for validating the PR workflow, webhook integration, and branch management processes - they contain only documentation content with no functional impact. The main substantive change is a code quality improvement in the dashboard page, where inline statistics calculations and repetitive Card components were extracted into reusable calculateDashboardStats helper function and StatCard component.

## Important Files Changed

| Filename | Score | Overview |
|----------|-------|----------|
| sample-test.md | 5/5 | Added temporary test file for PR workflow validation with basic markdown documentation |
| test-file.md | 5/5 | Added temporary test file for webhook integration and branch testing with documentation content |
| src/app/(protected)/dashboard/page.tsx | 5/5 | Refactored dashboard component to extract reusable StatCard component and calculateDashboardStats helper function |

## Confidence score: 5/5

✅ This PR is safe to merge with minimal risk as it contains only temporary test files and code quality improvements

Score reflects simple, well-structured changes with no breaking functionality - the test files have zero production impact and the dashboard refactor maintains identical behavior while improving code organization

**3 files reviewed, 0 issues found**`,
      },
      notes: "Score: 100/100. Excellent code quality with well-structured refactoring and comprehensive documentation.",
    },
    update: {
      greptileReview: {
        id: "greptile-demo-review-5",
        status: "completed",
        score: 100,
        summary: "Excellent code quality with well-structured refactoring and comprehensive documentation.",
        message: `# Greptile Overview

## Greptile Summary
This PR introduces two temporary test markdown files (sample-test.md and test-file.md) and refactors the dashboard component in the CustomerAI application. The test files are explicitly created for validating the PR workflow, webhook integration, and branch management processes - they contain only documentation content with no functional impact. The main substantive change is a code quality improvement in the dashboard page, where inline statistics calculations and repetitive Card components were extracted into reusable calculateDashboardStats helper function and StatCard component.

## Important Files Changed

| Filename | Score | Overview |
|----------|-------|----------|
| sample-test.md | 5/5 | Added temporary test file for PR workflow validation with basic markdown documentation |
| test-file.md | 5/5 | Added temporary test file for webhook integration and branch testing with documentation content |
| src/app/(protected)/dashboard/page.tsx | 5/5 | Refactored dashboard component to extract reusable StatCard component and calculateDashboardStats helper function |

## Confidence score: 5/5

✅ This PR is safe to merge with minimal risk as it contains only temporary test files and code quality improvements

Score reflects simple, well-structured changes with no breaking functionality - the test files have zero production impact and the dashboard refactor maintains identical behavior while improving code organization

**3 files reviewed, 0 issues found**`,
      },
    },
  });

  console.log("✅ Created PR #5 - PASS (100/100)");

  await prisma.$disconnect();
}

createDemoPRs();
