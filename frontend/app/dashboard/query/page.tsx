"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  askQuestion,
  clarifyQuestion,
  listDatabaseConnections,
  AskResult,
  DbConnectionResult,
} from "@/lib/api";

export default function QueryPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [connections, setConnections] = useState<DbConnectionResult[]>([]);
  const [databaseId, setDatabaseId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token) {
      listDatabaseConnections(token)
        .then((list) => {
          setConnections(list);
          if (list.length > 0) {
            setDatabaseId(String(list[list.length - 1].id));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleAsk = async () => {
    if (!token || !databaseId || !question) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await askQuestion(token, Number(databaseId), question);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  const handleClarify = async (answer: string) => {
    if (!token || !result?.conversation_id) return;
    setLoading(true);
    setError("");
    try {
      const res = await clarifyQuestion(token, result.conversation_id, answer);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to process clarification");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60">
        <Link href="/dashboard" className="text-lg font-semibold">
          Intelli<span className="text-indigo-400">SQL</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-1">Ask your database</h1>
        <p className="text-slate-400 mb-10">
          Type a question in plain English — we'll generate SQL and run it.
        </p>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Database Connection
            </label>
            {connections.length === 0 ? (
              <p className="text-sm text-slate-500">
                No database connections yet.{" "}
                <Link href="/dashboard/database" className="text-indigo-400 hover:text-indigo-300">
                  Connect one first
                </Link>
                .
              </p>
            ) : (
              <select
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a database...</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    #{conn.id} — {conn.database_name} ({conn.host})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Show top employees"
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={handleAsk}
            disabled={loading || !databaseId || !question}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium transition shadow-lg shadow-indigo-600/30"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        {result?.status === "NEEDS_CLARIFICATION" && (
          <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
            <p className="text-amber-300 font-medium mb-4">
              🤔 {result.clarification_question}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.clarification_options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleClarify(opt)}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {result?.status === "COMPLETE" && result.generated_sql && (
          <div className="mt-6 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Generated SQL</p>
              <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap">
                {result.generated_sql}
              </pre>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-sm font-medium">Results</p>
                <p className="text-xs text-slate-500">{result.row_count} row(s)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/30">
                      {result.columns?.map((col) => (
                        <th key={col} className="text-left px-5 py-2.5 font-medium text-slate-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows?.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-5 py-2.5 text-slate-300">
                            {cell === null ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}