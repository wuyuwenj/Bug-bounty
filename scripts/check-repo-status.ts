import "dotenv/config";

const GREPTILE_API_KEY = process.env.GREPTILE_API_KEY;
const OWNER = "wuyuwenj";
const REPO = "customerAI";

async function checkRepoStatus() {
  console.log(`🔍 Checking indexing status for ${OWNER}/${REPO}...\n`);

  try {
    // Check repository status
    const response = await fetch(
      `https://api.greptile.com/v2/repositories`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GREPTILE_API_KEY}`,
          "X-Github-Token": process.env.GITHUB_TOKEN || "",
        },
      }
    );

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
      return;
    }

    const data = await response.json();
    console.log(`\n📊 Repository Status:`);
    console.log(JSON.stringify(data, null, 2));

    // Try a simple query to test if it's ready
    console.log(`\n🧪 Testing query endpoint...`);
    const testQuery = await fetch(`https://api.greptile.com/v2/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GREPTILE_API_KEY}`,
        "Content-Type": "application/json",
        "X-Github-Token": process.env.GITHUB_TOKEN || "",
      },
      body: JSON.stringify({
        messages: [
          {
            content: "What is this repository about?",
            role: "user",
          },
        ],
        repositories: [
          {
            remote: "github",
            repository: `${OWNER}/${REPO}`,
            branch: "main",
          },
        ],
        sessionId: `test-${Date.now()}`,
      }),
    });

    console.log(`Query response status: ${testQuery.status}`);

    if (testQuery.ok) {
      const result = await testQuery.json();
      console.log(`✅ Repository is ready!`);
      console.log(`Sample response: ${result.message?.substring(0, 200)}...`);
    } else {
      const error = await testQuery.text();
      console.log(`❌ Repository not ready yet: ${error}`);
    }
  } catch (error) {
    console.error("Error checking status:", error);
  }
}

checkRepoStatus();
