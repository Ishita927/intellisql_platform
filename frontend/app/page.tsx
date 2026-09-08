// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert h-5 w-[100px]"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the{" "}
//             <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
//               page.tsx
//             </code>{" "}
//             file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert h-[14px] w-4"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={14}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

// import Link from "next/link";

// export default function LandingPage() {
//   return (
//     <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
//       {/* Background glow */}
//       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

//       <nav className="relative z-10 flex items-center justify-between px-8 py-6">
//         <span className="text-xl font-semibold tracking-tight">
//           Intelli<span className="text-indigo-400">SQL</span>
//         </span>
//         <div className="flex gap-3">
//           <Link
//             href="/login"
//             className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
//           >
//             Log in
//           </Link>
//           <Link
//             href="/register"
//             className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-lg shadow-indigo-600/30"
//           >
//             Get started
//           </Link>
//         </div>
//       </nav>

//       <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
//         <span className="mb-4 px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
//           Text-to-SQL, powered by AI
//         </span>
//         <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
//           Ask your database
//           <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//             questions in plain English
//           </span>
//         </h1>
//         <p className="mt-6 text-lg text-slate-400 max-w-xl">
//           Connect your company database, and let your team query it with natural
//           language — no SQL required.
//         </p>
//         <div className="mt-10 flex gap-4">
//           <Link
//             href="/register"
//             className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition shadow-xl shadow-indigo-600/30 hover:scale-105"
//           >
//             Create your workspace
//           </Link>
//           <Link
//             href="/login"
//             className="px-6 py-3 border border-slate-700 hover:border-slate-500 rounded-xl font-medium transition hover:bg-slate-800/50"
//           >
//             Sign in
//           </Link>
//         </div>
//       </div>

//       <footer className="relative z-10 text-center pb-8 text-xs text-slate-600">
//         Built with FastAPI + Next.js
//       </footer>
//     </main>
//   );
// }

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-xl font-semibold tracking-tight">
          Intelli<span className="text-indigo-400">SQL</span>
        </span>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <span className="mb-4 px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
          Text-to-SQL, powered by AI
        </span>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          Ask your database
          <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            questions in plain English
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-xl">
          Connect your company database, and let your team query it with natural
          language — no SQL required.
        </p>

        <div className="mt-12 grid sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <Link
            href="/register"
            className="p-6 bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-indigo-500 rounded-2xl transition text-left group"
          >
            <p className="text-2xl mb-2">🏢</p>
            <p className="font-semibold group-hover:text-indigo-300 transition">
              Create Workspace
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Set up your company and connect its database
            </p>
          </Link>

          <Link
            href="/login"
            className="p-6 bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-indigo-500 rounded-2xl transition text-left group"
          >
            <p className="text-2xl mb-2">🔑</p>
            <p className="font-semibold group-hover:text-indigo-300 transition">
              Sign In
            </p>
            <p className="text-sm text-slate-500 mt-1">
              For company admins managing the workspace
            </p>
          </Link>

          <Link
            href="/employee-login"
            className="p-6 bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-indigo-500 rounded-2xl transition text-left group"
          >
            <p className="text-2xl mb-2">👤</p>
            <p className="font-semibold group-hover:text-indigo-300 transition">
              Employee Login
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Ask questions about your company's data
            </p>
          </Link>
        </div>
      </div>

      <footer className="relative z-10 text-center pb-8 text-xs text-slate-600">
        Built with FastAPI + Next.js
      </footer>
    </main>
  );
}