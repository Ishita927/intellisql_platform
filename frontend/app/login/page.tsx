// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { login } from "@/lib/api";
// import { useAuth } from "@/context/AuthContext";

// export default function LoginPage() {
//   const router = useRouter();
//   const { setToken } = useAuth();
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const { access_token } = await login(form);
//       setToken(access_token);
//       router.push("/dashboard");
//     } catch (err: any) {
//       setError(err.message || "Invalid email or password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
//       <div className="w-full max-w-md">
//         <Link href="/" className="block text-center mb-8 text-xl font-semibold">
//           Intelli<span className="text-indigo-400">SQL</span>
//         </Link>

//         <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl">
//           <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
//           <p className="text-sm text-slate-400 mb-6">Sign in to your workspace.</p>

//           {error && (
//             <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
//               <input
//                 type="email"
//                 required
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 placeholder="rahul@abc.com"
//                 className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-600"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
//               <input
//                 type="password"
//                 required
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 placeholder="••••••••"
//                 className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-600"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition shadow-lg shadow-indigo-600/30"
//             >
//               {loading ? "Signing in..." : "Sign in"}
//             </button>
//           </form>

//           <p className="mt-6 text-center text-sm text-slate-400">
//             New here?{" "}
//             <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
//               Create a workspace
//             </Link>
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, getMe } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setToken, logout } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await login(form);
      const me = await getMe(access_token);

      if (me.role !== "admin") {
        setError(
          "This account is not an admin. Please use Employee Login instead."
        );
        setLoading(false);
        return;
      }

      setToken(access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8 text-xl font-semibold">
          Intelli<span className="text-indigo-400">SQL</span>
        </Link>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold mb-1">Admin Sign In</h1>
          <p className="text-sm text-slate-400 mb-6">
            Manage your workspace, database, and team.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {error}
              {error.includes("Employee Login") && (
                <Link href="/employee-login" className="block mt-1 underline">
                  Go to Employee Login →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@company.com"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition shadow-lg shadow-indigo-600/30"
            >
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New here?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Create a workspace
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-400">
            Employee?{" "}
            <Link href="/employee-login" className="text-indigo-400 hover:text-indigo-300">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}