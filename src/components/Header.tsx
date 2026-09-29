import React from 'react';
import { Sparkles, Database, LayoutDashboard, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'generator' | 'tracker';
  setActiveTab: (tab: 'generator' | 'tracker') => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, savedCount }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg tracking-wider">
              CIS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  CIS Job Application Tailor
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Ground-Truth Guardrails Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Undergraduate Resume Customizer, 3-Paragraph Cover Letter Generator &amp; SQLite ATS Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database status chip */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQLite:</span>
              <code className="text-slate-200 font-mono text-[11px]">applications_tracker.db</code>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'generator'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Application Generator</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'tracker'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tracker Dashboard</span>
                {savedCount > 0 && (
                  <span
                    className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'tracker'
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-800 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
