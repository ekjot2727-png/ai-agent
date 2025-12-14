'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center z-10">
        {/* Animated Logo */}
        <div className="relative mb-10">
          <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {/* Animated rings */}
          <div className="absolute inset-0 w-28 h-28 mx-auto rounded-2xl border-2 border-violet-500/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 w-28 h-28 mx-auto rounded-2xl border border-fuchsia-500/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          AutoOps <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-md mx-auto">
          Autonomous Agent Control Center
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {['Goal Planning', 'Auto Execution', 'Self-Reflection', 'Continuous Learning'].map((feature, idx) => (
            <span 
              key={feature} 
              className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-sm text-slate-300"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Countdown & CTA */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-400">System Online</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm">
              Redirecting in {countdown}s...
            </div>
          </div>

          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-lg transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
          >
            <span>Launch Dashboard</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Powered By</p>
          <div className="flex items-center justify-center gap-8 text-slate-500">
            <span className="text-sm">Next.js 14</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-sm">Oumi Reasoning</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-sm">Kestra Workflows</span>
          </div>
        </div>
      </div>
    </main>
  );
}
