"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface GreptileIssue {
  type: "error" | "warning" | "suggestion";
  severity: "critical" | "moderate" | "minor";
  message: string;
  file?: string;
  line?: number;
}

interface PRDetail {
  id: string;
  title: string;
  author: string;
  status: string;
  repo: string;
  owner: string;
  prNumber: number;
  greptileReview?: {
    score?: number;
    summary?: string;
    message?: string;
    issues?: GreptileIssue[];
    details?: {
      codeQuality?: string;
      bestPractices?: string;
      security?: string;
      performance?: string;
      maintainability?: string;
      suggestions?: string[];
      positives?: string[];
    };
  };
  notes?: string;
  creditedAmount?: number;
  customerId?: string;
}

export default function PRDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [pr, setPr] = useState<PRDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPR = async () => {
      try {
        const res = await fetch("/api/prs");
        const data = await res.json();
        if (data.success) {
          const foundPR = data.prs.find((p: PRDetail) => p.id === decodeURIComponent(id));
          setPr(foundPR || null);
        }
      } catch (error) {
        console.error("Error fetching PR:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPR();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <p className="text-red-600">PR not found</p>
        </div>
      </div>
    );
  }

  const review = pr.greptileReview;
  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-600";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "minor": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        {/* PR Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pr.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-mono">{pr.id}</span>
            <span>•</span>
            <span>by <span className="font-medium">{pr.author}</span></span>
            <span>•</span>
            <span className="capitalize">{pr.status}</span>
          </div>
          <a
            href={`https://github.com/${pr.owner}/${pr.repo}/pull/${pr.prNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            View on GitHub →
          </a>
        </div>

        {/* Review Score */}
        {review && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Code Review Score</h2>
                <div className={`text-4xl font-bold ${getScoreColor(review.score)}`}>
                  {review.score || "N/A"}/100
                </div>
              </div>
              {review.summary && (
                <p className="text-gray-700 bg-gray-50 p-4 rounded">{review.summary}</p>
              )}
            </div>

            {/* Issues */}
            {review.issues && review.issues.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Issues Found ({review.issues.length})
                </h2>
                <div className="space-y-3">
                  {review.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold uppercase">
                          {issue.type} • {issue.severity}
                        </span>
                        {issue.file && (
                          <span className="text-xs font-mono">
                            {issue.file}:{issue.line}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{issue.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {review.details && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
                <div className="space-y-4">
                  {review.details.codeQuality && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-1">
                        Code Quality
                      </h3>
                      <p className="text-gray-600 text-sm">{review.details.codeQuality}</p>
                    </div>
                  )}

                  {review.details.security && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-1">Security</h3>
                      <p className="text-gray-600 text-sm">{review.details.security}</p>
                    </div>
                  )}

                  {review.details.performance && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-1">
                        Performance
                      </h3>
                      <p className="text-gray-600 text-sm">{review.details.performance}</p>
                    </div>
                  )}

                  {review.details.bestPractices && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-1">
                        Best Practices
                      </h3>
                      <p className="text-gray-600 text-sm">{review.details.bestPractices}</p>
                    </div>
                  )}

                  {review.details.maintainability && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-1">
                        Maintainability
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {review.details.maintainability}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {review.details?.suggestions && review.details.suggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Suggestions for Improvement</h2>
                <ul className="space-y-2">
                  {review.details.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Positives */}
            {review.details?.positives && review.details.positives.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">What Was Done Well ✓</h2>
                <ul className="space-y-2">
                  {review.details.positives.map((positive, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">{positive}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Review Message */}
            {review.message && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Greptile Review</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
                      ),
                      p: ({ children }) => <p className="mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-5 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-50 p-4 rounded overflow-x-auto mb-3">
                          {children}
                        </pre>
                      ),
                      table: ({ children }) => (
                        <table className="min-w-full divide-y divide-gray-300 my-4 border">
                          {children}
                        </table>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => <tr>{children}</tr>,
                      th: ({ children }) => (
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-4 text-sm text-gray-900">{children}</td>
                      ),
                    }}
                  >
                    {review.message}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}

        {!review && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No review data available yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Poll Greptile to get review results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
