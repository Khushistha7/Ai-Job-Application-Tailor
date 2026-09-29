import React from 'react';
import { Sparkles, LayoutDashboard, FileText, ShieldCheck } from 'lucide-react';

export type MainNavTab = 'new-application' | 'my-applications' | 'my-resume';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, savedCount }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-sm tracking-wider">
              CIS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  CIS Job Application Tailor
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <span className="text-slate-600">&bull;</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ground-Truth Guardrails</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Western Michigan University &bull; Computer Information Systems Career Portfolio
              </p>
            </div>
          </div>

          {/* Clean 3-Item Navigation */}
          <nav className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('new-application')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'new-application'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>🏠</span>
              <span>New Application</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-applications')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my-applications'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>📊</span>
              <span>My Applications</span>
              {savedCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                    activeTab === 'my-applications'
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-cyan-300'
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-resume')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my-resume'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>📄</span>
              <span>My Resume</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
