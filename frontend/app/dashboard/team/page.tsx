"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { inviteEmployee, listCompanyUsers, CompanyUser } from "@/lib/api";

export default function TeamPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<CompanyUser[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "analyst" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token) refreshMembers();
  }, [token]);

  const refreshMembers = async () => {
    if (!token) return;
    try {
      const list = await listCompanyUsers(token);
      setMembers(list);
    } catch {}
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await inviteEmployee(token, form);
      setSuccess(`${form.name} has been invited. Share the login page and their credentials.`);
      setForm({ name: "", email: "", password: "", role: "analyst" });
      refreshMembers();
    } catch (err: any) {
      setError(err.message || "Failed to invite employee");
    } finally {
      setLoading(false);
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
        <div className="flex items-center gap-6">
          <Link href="/dashboard/database" className="text-sm text-slate-400 hover:text-white transition">
            ← Back to database
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-1">Manage your team</h1>
        <p className="text-slate-400 mb-10">
          Invite employees to access your company's database via the Employee Login.
        </p>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="font-medium mb-4">Invite an employee</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              required
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-medium transition"
            >
              {loading ? "Inviting..." : "Send invite"}
            </button>
          </form>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <p className="text-sm font-medium">Team members ({members.length})</p>
          </div>
          <div className="divide-y divide-slate-800/50">
            {members.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded uppercase">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}