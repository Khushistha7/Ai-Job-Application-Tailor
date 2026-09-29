import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Server,
  Database,
  Code,
  Award,
  Save,
} from 'lucide-react';
import { SAMPLE_MASTER_RESUME } from '../data/samples.ts';

interface ResumeTabProps {
  resumeText: string;
  onResumeChange: (newText: string) => void;
  onGoToNewApplication: () => void;
}

export const ResumeTab: React.FC<ResumeTabProps> = ({
  resumeText,
  onResumeChange,
  onGoToNewApplication,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftResume, setDraftResume] = useState(resumeText);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleSave = () => {
    onResumeChange(draftResume);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm("Reset your master resume back to Khushi's verified WMU CIS background?")) {
      setDraftResume(SAMPLE_MASTER_RESUME);
      onResumeChange(SAMPLE_MASTER_RESUME);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  // Verified skills catalogue grounded strictly in Khushi's verified resume
  const verifiedSkillCategories = [
    {
      category: 'IT Systems & Endpoint Support',
      icon: Server,
      skills: [
        'Hardware & Software Troubleshooting',
        'OS Imaging & Deployment',
        'Device Configuration (Windows/macOS)',
        'Asset Inventory Management (Snipe-IT)',
        'Classroom & AV Support',
        'Printer Support',
      ],
    },
    {
      category: 'Databases & Analytics',
      icon: Database,
      skills: [
        'SQL (SELECT, JOIN, GROUP BY)',
        'SQL Server Management Studio (SSMS)',
        'Power BI (DAX, Interactive Dashboards)',
        'Excel Data Modeling',
        'Microsoft Access',
      ],
    },
    {
      category: 'Enterprise Applications & CRM',
      icon: Code,
      skills: [
        'Salesforce CRM (Student Engagement Tracking)',
        'Microsoft Visio',
        'Technical Documentation & SOPs',
        'User Training & Onboarding',
        'Confidentiality & Compliance (FERPA)',
      ],
    },
    {
      category: 'Education & Verified Honors',
      icon: Award,
      skills: [
        'Western Michigan University – Haworth College of Business',
        'BBA in Computer Information Systems (GPA 3.89)',
        '1st Place WMPMI theProject Collegiate Competition 2026',
        "Dean's List (Multiple Semesters)",
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>My Master Resume</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Your master resume is the ground-truth foundation used to tailor your job applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onGoToNewApplication}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Create New Application</span>
          </button>
        </div>
      </div>

      {/* Ground-Truth Notice Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">How the AI uses your Master Resume:</span>{' '}
          The system will strictly reframe, prioritize, and articulate experiences and tools present in this resume. It will never fabricate technical tools, degrees, or certifications you do not have.
        </div>
      </div>

      {/* Verified Skills Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified Skills &amp; Competencies Available to AI</span>
          </h3>
          <span className="text-xs text-slate-400">Extracted from Master Resume</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {verifiedSkillCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{cat.category}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Master Resume Document (Markdown)</h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {resumeText.split('\n').length} lines &bull; {resumeText.length} characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraftResume(resumeText);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
                  title="Reset to default Khushi Shrestha CIS resume"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset to Default</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDraftResume(resumeText);
                    setIsEditing(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
                >
                  Edit Resume
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="px-5 py-2.5 bg-emerald-950/40 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Master Resume updated successfully! All new applications will reference these details.</span>
          </div>
        )}

        <div className="p-5">
          {isEditing ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Update or adjust your experiences, projects, or certifications below. Keep Markdown formatting.
              </p>
              <textarea
                value={draftResume}
                onChange={(e) => setDraftResume(e.target.value)}
                rows={22}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[550px] overflow-y-auto">
              {resumeText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
