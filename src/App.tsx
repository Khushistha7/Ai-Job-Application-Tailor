import React, { useState, useEffect, useCallback } from 'react';
import { Header, MainNavTab } from './components/Header.tsx';
import { GeneratorTab } from './components/GeneratorTab.tsx';
import { TrackerTab } from './components/TrackerTab.tsx';
import { ResumeTab } from './components/ResumeTab.tsx';
import { ApplicationRecord } from './types.ts';
import { SAMPLE_MASTER_RESUME } from './data/samples.ts';
import { Database, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('new-application');
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [masterResume, setMasterResume] = useState<string>(() => {
    return localStorage.getItem('cis_master_resume') || SAMPLE_MASTER_RESUME;
  });

  const handleResumeChange = (newText: string) => {
    setMasterResume(newText);
    localStorage.setItem('cis_master_resume', newText);
  };

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Clean Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={applications.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'new-application' && (
          <GeneratorTab
            masterResume={masterResume}
            onApplicationSaved={fetchApplications}
            onGoToTracker={() => setActiveTab('my-applications')}
          />
        )}

        {activeTab === 'my-applications' && (
          <TrackerTab
            applications={applications}
            onRefresh={fetchApplications}
            onGoToGenerator={() => setActiveTab('new-application')}
          />
        )}

        {activeTab === 'my-resume' && (
          <ResumeTab
            resumeText={masterResume}
            onResumeChange={handleResumeChange}
            onGoToNewApplication={() => setActiveTab('new-application')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">
              CIS Job Application Tailor &amp; ATS Tracker
            </span>
            <span className="text-slate-700">&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Strict Ground-Truth Guardrails
            </span>
            <span className="text-slate-700">&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              SQLite Persistent Pipeline
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Western Michigan University &bull; Haworth College of Business
          </div>
        </div>
      </footer>
    </div>
  );
}
