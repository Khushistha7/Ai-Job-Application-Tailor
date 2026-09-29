import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Link2,
  FileText,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  Save,
  CheckSquare,
  Square,
  ArrowRight,
  Loader2,
  ExternalLink,
  Copy,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToneMode, ApplicationTailorOutput, ApplicationStatus } from '../types.ts';
import { SAMPLE_MASTER_RESUME, SAMPLE_JOBS, SAMPLE_JOB_URLS } from '../data/samples.ts';
import { BulletComparison } from './BulletComparison.tsx';
import { CoverLetterCard } from './CoverLetterCard.tsx';

interface GeneratorTabProps {
  masterResume?: string;
  onApplicationSaved: () => void;
  onGoToTracker: () => void;
}

// Student's verified skills for instant matching calculation
const VERIFIED_STUDENT_SKILLS = [
  'Hardware Troubleshooting',
  'Software Troubleshooting',
  'OS Imaging',
  'System Deployment',
  'Device Configuration',
  'Snipe-IT',
  'Asset Inventory',
  'SQL',
  'Database Management',
  'Power BI',
  'Excel',
  'Salesforce CRM',
  'Technical Documentation',
  'SOPs',
  'Customer Support',
  'Help Desk',
  'Printer Support',
  'AV Support',
  'Compliance',
  'Project Management',
];

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  masterResume = SAMPLE_MASTER_RESUME,
  onApplicationSaved,
  onGoToTracker,
}) => {
  // Input method: 'url' (default) or 'text'
  const [inputMethod, setInputMethod] = useState<'url' | 'text'>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchSuccess, setUrlFetchSuccess] = useState<string | null>(null);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  // Job data state
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [jobDescription, setJobDescription] = useState('');
  const [isEditingJobInfo, setIsEditingJobInfo] = useState(false);

  // Tailoring settings
  const [toneMode, setToneMode] = useState<ToneMode>('auto');

  // Generation state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationTailorOutput | null>(null);

  // Missing skills collapse state
  const [showAllMissingSkills, setShowAllMissingSkills] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState({
    reviewedBullets: false,
    reviewedCoverLetter: false,
    checkedMissingSkills: false,
    confirmedDetails: false,
    submittedApplication: false,
  });

  // Saving state
  const [saveStatus, setSaveStatus] = useState<ApplicationStatus>('Applied');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Determine current active workflow step
  const currentStep = useMemo(() => {
    if (result) return 4; // Review & Save
    if (loading) return 3; // Tailor in progress
    if (jobDescription.trim().length > 30) return 2; // Review Job & ready to tailor
    return 1; // Add Job
  }, [result, loading, jobDescription]);

  // Compute matched verified skills in current job description
  const matchedSkills = useMemo(() => {
    if (!jobDescription) return [];
    const lower = jobDescription.toLowerCase();
    return VERIFIED_STUDENT_SKILLS.filter((skill) => {
      const parts = skill.toLowerCase().split(/[\s/]+/);
      return parts.some((p) => p.length > 3 && lower.includes(p));
    });
  }, [jobDescription]);

  // Handle URL Fetching
  const handleFetchUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || jobUrl).trim();
    if (!targetUrl) {
      setUrlFetchError('Please paste a job URL link first.');
      return;
    }

    setUrlFetchError(null);
    setUrlFetchSuccess(null);
    setIsFetchingUrl(true);
    setResult(null);

    try {
      const res = await fetch('/api/extract-job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract job posting from this link.');
      }

      setCompanyName(data.company_name || '');
      setJobTitle(data.job_title || '');
      setJobDescription(data.job_description || '');

      const domain = new URL(targetUrl).hostname.replace('www.', '');
      setUrlFetchSuccess(`Successfully fetched job posting from ${domain}! Review the details below.`);
    } catch (err: any) {
      console.error(err);
      setUrlFetchError(err.message || 'Could not fetch job from this link. You can paste the job description directly.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Handle sample selection
  const handleSelectSample = (sample: typeof SAMPLE_JOBS[0]) => {
    setCompanyName(sample.company);
    setJobTitle(sample.title);
    setJobLocation('Kalamazoo, MI (Hybrid)');
    setJobType('Full-time / Entry Level');
    setJobDescription(sample.description);
    setToneMode(sample.tone);
    setUrlFetchSuccess(`Loaded sample job for ${sample.company}.`);
    setUrlFetchError(null);
    setResult(null);
  };

  const handleSelectSampleUrl = async (url: string) => {
    setJobUrl(url);
    setInputMethod('url');
    await handleFetchUrl(url);
  };

  // Execute Tailoring
  const handleGenerateTailored = async () => {
    if (!jobDescription.trim()) {
      setError('Please add a job posting first (via Job URL or pasting text).');
      return;
    }

    setError(null);
    setLoading(true);
    setSaveSuccess(false);

    setLoadingStep('Auditing verified master resume competencies against job description...');
    const t1 = setTimeout(() => {
      setLoadingStep('Cross-referencing technical requirements & isolating missing skills...');
    }, 1200);
    const t2 = setTimeout(() => {
      setLoadingStep('Generating 3 verified ATS bullet points & 3-paragraph tailored cover letter...');
    }, 2400);

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_resume: masterResume,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
          tone_mode: toneMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to tailor application.');
      }

      setResult(data);

      // Synchronize with detected company and title
      if (data.detected_company_name) {
        setCompanyName(data.detected_company_name);
      }
      if (data.detected_job_title) {
        setJobTitle(data.detected_job_title);
      }

      // Smooth scroll to tailored section
      setTimeout(() => {
        const el = document.getElementById('tailored-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating application.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Handle Save Application
  const handleSaveApplication = async () => {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    const finalCompany = result.detected_company_name || companyName || 'Target Company';
    const finalTitle = result.detected_job_title || jobTitle || 'Target Role';

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: finalCompany,
          job_title: finalTitle,
          job_description: jobDescription,
          cover_letter: result.cover_letter,
          bullet_transformations: result.bullet_transformations,
          missing_skills: result.missing_skills_flagged,
          status: saveStatus,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save application.');
      }

      setSaveSuccess(true);
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.8 },
      });
      onApplicationSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save to application tracker.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const handleStartOver = () => {
    setJobUrl('');
    setCompanyName('');
    setJobTitle('');
    setJobLocation('');
    setJobDescription('');
    setResult(null);
    setError(null);
    setUrlFetchSuccess(null);
    setUrlFetchError(null);
    setSaveSuccess(false);
  };

  const activeCompanyName = result?.detected_company_name || companyName || 'Target Company';
  const activeJobTitle = result?.detected_job_title || jobTitle || 'Target Role';

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">New Job Application</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a job posting and create a tailored application using your master resume.
            </p>
          </div>

          {(jobDescription || result) && (
            <button
              type="button"
              onClick={handleStartOver}
              className="self-start text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              Start New Job
            </button>
          )}
        </div>

        {/* Workflow Progress Indicator */}
        <div className="mt-5 grid grid-cols-4 gap-2 text-xs">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
              currentStep === 1
                ? 'bg-blue-950/60 border-blue-500/60 text-white font-semibold'
                : currentStep > 1
                ? 'bg-slate-900/90 border-slate-800 text-emerald-400'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep > 1
                  ? 'bg-emerald-500 text-slate-950'
                  : currentStep === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className="truncate">Add Job</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
              currentStep === 2
                ? 'bg-blue-950/60 border-blue-500/60 text-white font-semibold'
                : currentStep > 2
                ? 'bg-slate-900/90 border-slate-800 text-emerald-400'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep > 2
                  ? 'bg-emerald-500 text-slate-950'
                  : currentStep === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span className="truncate">Review Job</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
              currentStep === 3
                ? 'bg-blue-950/60 border-blue-500/60 text-white font-semibold animate-pulse'
                : currentStep > 3
                ? 'bg-slate-900/90 border-slate-800 text-emerald-400'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep > 3
                  ? 'bg-emerald-500 text-slate-950'
                  : currentStep === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > 3 ? '✓' : '3'}
            </span>
            <span className="truncate">Tailor Application</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
              currentStep === 4
                ? 'bg-blue-950/60 border-blue-500/60 text-white font-semibold'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              4
            </span>
            <span className="truncate">Review &amp; Save</span>
          </div>
        </div>
      </div>

      {/* STEP 1: ADD A JOB CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h3 className="text-sm font-bold text-white">Add a Job</h3>
          </div>

          {/* Clean Segmented Option Toggle */}
          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setInputMethod('url')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                inputMethod === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Job URL</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                inputMethod === 'text'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Job Description</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {inputMethod === 'url' ? (
            /* URL MODE */
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Paste job posting link from Greenhouse, Lever, Indeed, or career portal:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full">
                  <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchUrl();
                      }
                    }}
                    placeholder="https://careers.company.com/job/..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {jobUrl && (
                    <button
                      type="button"
                      onClick={() => setJobUrl('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isFetchingUrl || !jobUrl.trim()}
                  onClick={() => handleFetchUrl()}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-40"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Job...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Fetch Job Posting</span>
                    </>
                  )}
                </button>
              </div>

              {urlFetchSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{urlFetchSuccess}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUrlFetchSuccess(null)}
                    className="text-emerald-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {urlFetchError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{urlFetchError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputMethod('text')}
                    className="text-cyan-300 underline font-semibold text-[11px] ml-2 shrink-0"
                  >
                    Paste text instead
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* RAW TEXT PASTE MODE */
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Paste the target job description text:
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (result) setResult(null);
                }}
                rows={8}
                placeholder="Paste responsibilities, qualifications, and requirements from the job posting..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>
          )}

          {/* Secondary sample/demo link testing section */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="text-[11px] text-slate-400">Want to test the app? Try a sample job:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectSample(SAMPLE_JOBS[0])}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
              >
                🩺 Stryker (Med-Tech Support)
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample(SAMPLE_JOBS[1])}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 transition"
              >
                🏥 Bronson (Healthcare Data Analyst)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: JOB INFORMATION & SKILLS MATCH */}
      {jobDescription.trim().length > 0 && (
        <div className="space-y-4">
          {/* Job Information Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Job Information</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingJobInfo(!isEditingJobInfo)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              >
                <Edit2 className="w-3 h-3 text-cyan-400" />
                <span>{isEditingJobInfo ? 'Done Editing' : 'Edit Information'}</span>
              </button>
            </div>

            <div className="p-5">
              {isEditingJobInfo ? (
                /* Editable Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Stryker, Bronson Health, Epic"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Position / Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Associate IT Systems Specialist"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      placeholder="e.g. Kalamazoo, MI / Hybrid"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Job Type</label>
                    <input
                      type="text"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      placeholder="e.g. Full-time, Internship"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                /* Clean Read-Only Display */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Company</span>
                    <span className="font-semibold text-white text-sm">
                      {companyName || 'Not specified (auto-detected)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Position</span>
                    <span className="font-semibold text-white text-sm">
                      {jobTitle || 'Target Role'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Location</span>
                    <span className="text-slate-300 font-medium">
                      {jobLocation || 'Kalamazoo, MI / Hybrid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Job Type</span>
                    <span className="text-slate-300 font-medium">
                      {jobType || 'Full-time'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Your Resume vs. This Job (Matched & Missing Skills) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Your Resume vs. This Job</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time alignment between Khushi's verified master resume and this job posting.
              </p>
            </div>

            {/* Matched Skills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Matching Verified Competencies ({matchedSkills.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-500/20"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    General CIS competencies align with job requirements.
                  </span>
                )}
              </div>
            </div>

            {/* Missing Skills Warning (If result generated) */}
            {result?.missing_skills_flagged && result.missing_skills_flagged.length > 0 ? (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      ⚠️ Missing Skills Flagged ({result.missing_skills_flagged.length})
                    </span>
                  </span>
                  {result.missing_skills_flagged.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMissingSkills(!showAllMissingSkills)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>{showAllMissingSkills ? 'Show Less' : 'Show All'}</span>
                      {showAllMissingSkills ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The job description mentions the following tools not present in your Master Resume. In strict compliance with our ground-truth rules, the AI has <strong>excluded</strong> these from your resume bullets and cover letter:
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(showAllMissingSkills
                    ? result.missing_skills_flagged
                    : result.missing_skills_flagged.slice(0, 5)
                  ).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-950/60 text-amber-200 border border-amber-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                  {!showAllMissingSkills && result.missing_skills_flagged.length > 5 && (
                    <span className="text-[11px] text-amber-400/80 px-2 py-0.5">
                      +{result.missing_skills_flagged.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* STEP 3: TAILOR APPLICATION PRIMARY ACTION */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/30 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ready to Tailor Application</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates 3 ATS action bullets and a 3-paragraph tone-adapted cover letter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {/* Tone selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setToneMode('auto')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    toneMode === 'auto' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Auto-detect atmosphere"
                >
                  Auto Tone
                </button>
                <button
                  type="button"
                  onClick={() => setToneMode('tech')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    toneMode === 'tech' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tech / Startup (Concise & direct)"
                >
                  Tech
                </button>
                <button
                  type="button"
                  onClick={() => setToneMode('corporate')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    toneMode === 'corporate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Corporate / Healthcare (Formal & structured)"
                >
                  Corporate
                </button>
              </div>

              {/* SINGLE CLEAR PRIMARY BUTTON */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateTailored}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Tailoring Application...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>✨ Generate Tailored Application</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading status bar */}
          {loading && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {loadingStep || 'Tailoring application...'}
                </span>
                <span className="text-[11px] text-blue-400">Strict Ground-Truth Active</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-white font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: TAILORED APPLICATION RESULTS */}
      {result && (
        <div id="tailored-results-section" className="space-y-6 pt-4 border-t border-slate-800">
          {/* Tailored App Title Header */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                ③ Tailored Application
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Application Package for {activeCompanyName}
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {activeJobTitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tone Profile:</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {result.detected_company_type}
              </span>
            </div>
          </div>

          {/* 1. Resume Bullet Suggestions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
            <BulletComparison bulletTransformations={result.bullet_transformations} />
          </div>

          {/* 2. Cover Letter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <CoverLetterCard
              coverLetter={result.cover_letter}
              detectedCompanyType={result.detected_company_type}
              onChangeCoverLetter={(newLetter) =>
                setResult({
                  ...result,
                  cover_letter: newLetter,
                })
              }
            />
          </div>

          {/* 3. Application Checklist & Save */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 shadow-xl space-y-5">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>Before You Apply</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify each step before submitting and saving to your application tracker.
              </p>
            </div>

            {/* Checklist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={checklist.reviewedBullets}
                  onChange={(e) => setChecklist({ ...checklist, reviewedBullets: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className={checklist.reviewedBullets ? 'text-slate-200 line-through' : 'text-slate-300'}>
                  Review tailored resume bullets
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={checklist.reviewedCoverLetter}
                  onChange={(e) => setChecklist({ ...checklist, reviewedCoverLetter: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className={checklist.reviewedCoverLetter ? 'text-slate-200 line-through' : 'text-slate-300'}>
                  Review cover letter
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={checklist.checkedMissingSkills}
                  onChange={(e) => setChecklist({ ...checklist, checkedMissingSkills: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className={checklist.checkedMissingSkills ? 'text-slate-200 line-through' : 'text-slate-300'}>
                  Check missing skills
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={checklist.confirmedDetails}
                  onChange={(e) => setChecklist({ ...checklist, confirmedDetails: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className={checklist.confirmedDetails ? 'text-slate-200 line-through' : 'text-slate-300'}>
                  Confirm company and job title
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition sm:col-span-2">
                <input
                  type="checkbox"
                  checked={checklist.submittedApplication}
                  onChange={(e) => setChecklist({ ...checklist, submittedApplication: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className={checklist.submittedApplication ? 'text-slate-200 line-through' : 'text-slate-300'}>
                  Submit application on company portal
                </span>
              </label>
            </div>

            {/* Save Application Button */}
            <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Save with status:</span>
                <select
                  value={saveStatus}
                  onChange={(e) => setSaveStatus(e.target.value as ApplicationStatus)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Applied">Applied</option>
                  <option value="Draft">Draft</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer Extended">Offer Extended</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveApplication}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>💾 Save Application</span>
                </button>

                {saveSuccess && (
                  <button
                    type="button"
                    onClick={onGoToTracker}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition shrink-0"
                  >
                    <span>View in My Applications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>Application successfully saved to your tracker dashboard!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
