import "dotenv/config";

// Simulate a Greptile comment webhook
const mockGreptileComment = {
  action: "created",
  issue: {
    number: 5,
    pull_request: {
      url: "https://api.github.com/repos/wuyuwenj/customerAI/pulls/5"
    }
  },
  comment: {
    user: {
      login: "greptile-apps[bot]"
    },
    body: `Greptile Overview
Greptile Summary
This PR introduces two temporary test markdown files (sample-test.md and test-file.md) and refactors the dashboard component in the CustomerAI application.

Important Files Changed
Filename    Score    Overview
sample-test.md    5/5    Added temporary test file for PR workflow validation with basic markdown documentation
test-file.md    5/5    Added temporary test file for webhook integration and branch testing with documentation content
src/app/(protected)/dashboard/page.tsx    5/5    Refactored dashboard component to extract reusable StatCard component

Confidence score: 5/5
This PR is safe to merge with minimal risk as it contains only temporary test files and code quality improvements`
  },
  repository: {
    name: "customerAI",
    owner: {
      login: "wuyuwenj"
    }
  }
};

async function testWebhook() {
  console.log("🧪 Testing comment webhook handler...\n");

  try {
    const response = await fetch("http://localhost:3000/api/webhooks/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockGreptileComment),
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testWebhook();
