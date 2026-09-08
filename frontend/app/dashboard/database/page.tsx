"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  testDatabaseConnection,
  saveDatabaseConnection,
  scanDatabaseSchema,
  listDatabaseConnections,
  TestResult,
  DbConnectionResult,
  SchemaScanResult,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export default function DatabaseConnectionPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    host: "localhost",
    port: 5432,
    database_name: "",
    username: "postgres",
    password: "",
  });

  const [testStatus, setTestStatus] = useState<Status>("idle");
  const [testMessage, setTestMessage] = useState("");

  const [connectStatus, setConnectStatus] = useState<Status>("idle");
  const [connection, setConnection] = useState<DbConnectionResult | null>(null);

  const [scanStatus, setScanStatus] = useState<Status>("idle");
  const [schema, setSchema] = useState<SchemaScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push(user ? "/dashboard/query" : "/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
  if (token) {
    listDatabaseConnections(token)
      .then((connections) => {
        if (connections.length > 0) {
          // restore the most recent connection so the page doesn't reset to an empty form
          const existing = connections[connections.length - 1];
          setConnection(existing);
          setConnectStatus("success");
          setForm((f) => ({
            ...f,
            host: existing.host,
            port: existing.port,
            database_name: existing.database_name,
            username: existing.username,
          }));
        }
      })
      .catch(() => {});
  }
}, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "port" ? Number(value) : value }));
  };

  const handleTest = async () => {
    if (!token) return;
    setTestStatus("loading");
    setTestMessage("");
    try {
      const result: TestResult = await testDatabaseConnection(token, form);
      if (result.success) {
        setTestStatus("success");
        setTestMessage(result.message);
      } else {
        setTestStatus("error");
        setTestMessage(result.message);
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Test failed");
    }
  };

  const handleConnect = async () => {
    if (!token) return;
    setConnectStatus("loading");
    setErrorMsg("");
    try {
      const result = await saveDatabaseConnection(token, form);
      setConnection(result);
      setConnectStatus("success");
    } catch (err: any) {
      setConnectStatus("error");
      setErrorMsg(err.message || "Failed to save connection");
    }
  };

  const handleScan = async () => {
    if (!token || !connection) return;
    setScanStatus("loading");
    setErrorMsg("");
    try {
      const result = await scanDatabaseSchema(token, connection.id);
      setSchema(result);
      setScanStatus("success");
    } catch (err: any) {
      setScanStatus("error");
      setErrorMsg(err.message || "Schema scan failed");
    }
  };

  if (authLoading || !user || user.role !== "admin") {
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-1">Connect your database</h1>
        <p className="text-slate-400 mb-10">
          Link your company's PostgreSQL database so IntelliSQL can answer questions about it.
        </p>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Database Type</label>
            <select
              disabled
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-400"
            >
              <option>PostgreSQL</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Host</label>
              <input
                name="host"
                value={form.host}
                onChange={handleChange}
                placeholder="localhost"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Port</label>
              <input
                name="port"
                type="number"
                value={form.port}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Database Name</label>
            <input
              name="database_name"
              value={form.database_name}
              onChange={handleChange}
              placeholder="company_sales_db"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="postgres"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {testMessage && (
            <div
              className={`px-4 py-3 rounded-lg text-sm border ${
                testStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {testMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testStatus === "loading"}
              className="flex-1 py-3 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 rounded-lg font-medium transition disabled:opacity-50"
            >
              {testStatus === "loading" ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={handleConnect}
              disabled={connectStatus === "loading" || testStatus !== "success"}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium transition shadow-lg shadow-indigo-600/30"
            >
              {connectStatus === "loading" ? "Connecting..." : "Connect Database"}
            </button>
          </div>

          {testStatus !== "success" && (
            <p className="text-xs text-slate-500 text-center">
              Run a successful test before connecting.
            </p>
          )}
        </div>

        {connectStatus === "success" && connection && (
          <div className="mt-6 bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-300 font-medium">
                  ✓ Connected to {connection.database_name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {connection.host}:{connection.port} · connection #{connection.id}
                </p>
              </div>
              <button
                onClick={handleScan}
                disabled={scanStatus === "loading"}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                {scanStatus === "loading" ? "Scanning..." : "Scan Schema"}
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 text-center py-2.5 border border-slate-700 hover:border-indigo-500 rounded-lg text-sm transition"
              >
                Continue as Admin
              </Link>
              <Link
                href="/dashboard/team"
                className="flex-1 text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition"
              >
                Invite your team
              </Link>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {schema && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">
              Discovered schema — {schema.tables.length} table
              {schema.tables.length !== 1 ? "s" : ""}
            </h2>
            {schema.tables.map((table) => (
              <div
                key={table.name}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-5"
              >
                <p className="font-medium text-indigo-300 mb-3">{table.name}</p>
                <div className="space-y-1.5">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between text-sm py-1 border-b border-slate-800/50 last:border-0"
                    >
                      <span className="text-slate-300">
                        {col.name}
                        {col.is_primary_key && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                            PK
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">{col.type}</span>
                    </div>
                  ))}
                </div>
                {table.foreign_keys.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-1">
                    {table.foreign_keys.map((fk, i) => (
                      <p key={i} className="text-xs text-slate-500">
                        {fk.column} → {fk.references_table}.{fk.references_column}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}