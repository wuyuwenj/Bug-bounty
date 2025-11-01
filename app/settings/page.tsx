"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserMapping {
  githubUsername: string;
  stripeCustomerId: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserMapping[]>([]);
  const [githubUsername, setGithubUsername] = useState("");
  const [stripeCustomerId, setStripeCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/settings/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername, stripeCustomerId }),
      });

      const data = await res.json();

      if (data.success) {
        setGithubUsername("");
        setStripeCustomerId("");
        await fetchUsers();
      } else {
        setError(data.error || "Failed to add mapping");
      }
    } catch (error) {
      setError("Error adding mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete mapping for ${username}?`)) return;

    try {
      const res = await fetch("/api/settings/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: username }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchUsers();
      } else {
        alert(data.error || "Failed to delete mapping");
      }
    } catch (error) {
      alert("Error deleting mapping");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Map GitHub usernames to Stripe customer IDs
          </p>
        </div>

        {/* Add User Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add User Mapping</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g., wuyuwenj"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stripe Customer ID
              </label>
              <input
                type="text"
                value={stripeCustomerId}
                onChange={(e) => setStripeCustomerId(e.target.value)}
                placeholder="e.g., cus_xxxxxxxxxxxxx"
                required
                pattern="cus_.*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must start with "cus_". Find this in your{" "}
                <a
                  href="https://dashboard.stripe.com/test/customers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Stripe Dashboard
                </a>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? "Adding..." : "Add Mapping"}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Current Mappings ({users.length})</h2>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-2">No mappings yet</p>
              <p className="text-sm">
                Add a GitHub username and Stripe customer ID above to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div
                  key={user.githubUsername}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.githubUsername}
                    </div>
                    <div className="text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {user.stripeCustomerId}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(user.githubUsername)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>
              Go to{" "}
              <a
                href="https://dashboard.stripe.com/test/customers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Stripe Dashboard (Test Mode)
              </a>
            </li>
            <li>Create a test customer or find an existing one</li>
            <li>Copy the customer ID (starts with "cus_")</li>
            <li>Enter the GitHub username and customer ID above</li>
            <li>
              When a PR from that GitHub user passes review, credits will be sent to the
              mapped Stripe customer
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
