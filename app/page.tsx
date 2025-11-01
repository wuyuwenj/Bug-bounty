"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PRItem {
  id: string;
  title: string;
  author: string;
  status: "reviewing" | "pass" | "fail" | "credited" | "error";
  notes?: string;
  creditedAmount?: number;
  customerId?: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [prs, setPrs] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/prs");
      const data = await res.json();
      if (data.success) {
        setPrs(data.prs);
      }
    } catch (error) {
      console.error("Error fetching PRs:", error);
    }
  };

  useEffect(() => {
    fetchPRs();
    const interval = setInterval(fetchPRs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePoll = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch("/api/greptile/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchPRs();
      } else {
        alert(`Error: ${data.error || "Failed to poll"}`);
      }
    } catch (error) {
      alert("Error polling Greptile");
    } finally {
      setLoading(null);
    }
  };

  const handleCredit = async (id: string) => {
    if (!confirm("Credit $5.00 to this PR author?")) return;

    setLoading(id);
    try {
      const res = await fetch("/api/stripe/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cents: 500 }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`✓ Credited $5.00 to ${data.customerId}`);
        await fetchPRs();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error crediting Stripe");
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: PRItem["status"]) => {
    switch (status) {
      case "reviewing": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "pass": return "bg-green-100 text-green-800 border-green-300";
      case "fail": return "bg-red-100 text-red-800 border-red-300";
      case "credited": return "bg-blue-100 text-blue-800 border-blue-300";
      case "error": return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Greptile PR Bonus Dashboard
            </h1>
            <p className="text-gray-600">
              Review PRs, poll Greptile for verdicts, and credit contributors via Stripe
            </p>
          </div>
          <Link href="/settings">
            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition">
              ⚙️ Settings
            </button>
          </Link>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Pull Requests ({prs.length})
          </h2>
          <button
            onClick={fetchPRs}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
          >
            Refresh
          </button>
        </div>

        {prs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No PRs yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Set up a GitHub webhook to start receiving PRs
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pr.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pr.id} • by <span className="font-medium">{pr.author}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      pr.status
                    )}`}
                  >
                    {pr.status}
                  </span>
                </div>

                {pr.notes && (
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {pr.notes}
                    </p>
                  </div>
                )}

                {pr.customerId && (
                  <div className="text-sm text-gray-600 mb-3">
                    Stripe Customer: <code className="bg-gray-100 px-2 py-1 rounded">{pr.customerId}</code>
                    {pr.creditedAmount && (
                      <span className="ml-2">• ${(pr.creditedAmount / 100).toFixed(2)} credited</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/pr/${encodeURIComponent(pr.id)}`}>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium">
                      View Details
                    </button>
                  </Link>

                  <button
                    onClick={() => handlePoll(pr.id)}
                    disabled={loading === pr.id || pr.status === "credited"}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    {loading === pr.id ? "Loading..." : "Poll Greptile"}
                  </button>

                  <button
                    onClick={() => handleCredit(pr.id)}
                    disabled={
                      loading === pr.id ||
                      pr.status !== "pass"
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    Credit $5.00
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
