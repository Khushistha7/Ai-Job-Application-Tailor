import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle2,
  FileCheck,
  Building2,
  Briefcase,
  Sliders,
  RotateCcw,
  Loader2,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Link2,
  Globe,
  ExternalLink,
  Check,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToneMode, ApplicationTailorOutput, ApplicationStatus } from '../types.ts';
import { SAMPLE_MASTER_RESUME, SAMPLE_JOBS, SAMPLE_JOB_URLS } from '../data/samples.ts';
import { MissingSkillsBanner } from './MissingSkillsBanner.tsx';
import { BulletComparison } from './BulletComparison.tsx';
import { CoverLetterCard } from './CoverLetterCard.tsx';

interface GeneratorTabProps {
  onApplicationSaved: () => void;
  onGoToTracker: () => void;
}

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  onApplicationSaved,
  onGoToTracker,
}) => {
  // Input mode: 'url' (skip copying & pasting) or 'manual' (paste raw text)
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchSuccessMessage, setUrlFetchSuccessMessage] = useState<string | null>(null);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(true);

  // Form states - clean by default so user's own job description is never overridden by Stryker
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [toneMode, setToneMode] = useState<ToneMode>('auto');
  const [masterResume, setMasterResume] = useState(SAMPLE_MASTER_RESUME);
  const [jobDescription, setJobDescription] = useState('');

  // Output states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationTailorOutput | null>(null);

  // Saving state
  const [saveStatus, setSaveStatus] = useState<ApplicationStatus>('Applied');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch job details from URL
  const handleFetchUrl = async (targetUrlOverride?: string): Promise<{ company: string; title: string; desc: string } | null> => {
    const urlToUse = (targetUrlOverride || jobUrl).trim();
    if (!urlToUse) {
      setUrlFetchError('Please paste a job URL link first.');
      return null;
    }

    setUrlFetchError(null);
    setUrlFetchSuccessMessage(null);
    setIsFetchingUrl(true);

    try {
      const res = await fetch('/api/extract-job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract job posting from this URL.');
      }

      if (data.company_name) setCompanyName(data.company_name);
      if (data.job_title) setJobTitle(data.job_title);
      if (data.job_description) setJobDescription(data.job_description);

      const hostname = new URL(urlToUse).hostname.replace('www.', '');
      const methodLabel =
        data.extraction_method === 'json_ld'
          ? 'Structured Job Schema'
          : data.extraction_method === 'gemini_nlp'
          ? 'AI Webpage Parsing'
          : 'Direct HTML Extraction';

      setUrlFetchSuccessMessage(
        `Successfully extracted ${data.job_title ? `"${data.job_title}"` : 'job posting'} from ${hostname} (${methodLabel})`
      );
      setShowExtractedPreview(true);

      return {
        company: data.company_name || companyName,
        title: data.job_title || jobTitle,
        desc: data.job_description || jobDescription,
      };
    } catch (err: any) {
      console.error('URL extraction error:', err);
      setUrlFetchError(err.message || 'Could not fetch job from this link. You can still paste the text in the Raw Text tab.');
      return null;
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // 1-Click: Fetch URL and immediately tailor resume & cover letter
  const handleFetchAndTailor = async () => {
    const fetched = await handleFetchUrl();
    if (fetched && fetched.desc) {
      await executeTailor(fetched.desc, fetched.company, fetched.title);
    }
  };

  const handleLoadSampleUrl = async (sampleUrl: string) => {
    setJobUrl(sampleUrl);
    await handleFetchUrl(sampleUrl);
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_JOBS[sampleIndex];
    setCompanyName(sample.company);
    setJobTitle(sample.title);
    setToneMode(sample.tone);
    setJobDescription(sample.description);
    setUrlFetchSuccessMessage(null);
    setUrlFetchError(null);
    if (!masterResume.trim()) {
      setMasterResume(SAMPLE_MASTER_RESUME);
    }
  };

  const handleJobDescriptionChange = (newVal: string) => {
    setJobDescription(newVal);
    if (result) {
      setResult(null);
      setSaveSuccess(false);
    }
  };

  const handleClearAll = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setJobUrl('');
    setUrlFetchSuccessMessage(null);
    setUrlFetchError(null);
    setResult(null);
    setError(null);
  };

  const executeTailor = async (jdText: string, compName: string, roleTitle: string) => {
    if (!masterResume.trim()) {
      setError('Please provide your Master Resume text in Markdown.');
      return;
    }
    if (!jdText.trim()) {
      setError('Please provide the target Job Description or fetch it from a Job URL.');
      return;
    }

    setError(null);
    setLoading(true);
    setSaveSuccess(false);

    setLoadingStep('Ground-Truth Guardrail Audit: Analyzing Khushi’s verified resume facts...');
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Cross-referencing JD requirements & isolating unmatched technical skills...');
    }, 1200);
    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Generating 3 verified bullet transformations & 3-paragraph tone-adapted cover letter...');
    }, 2500);

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_resume: masterResume,
          job_description: jdText,
          company_name: compName,
          job_title: roleTitle,
          tone_mode: toneMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to tailor application.');
      }

      setResult(data);
      // Synchronize input fields with the real company and role detected from the user's JD!
      if (data.detected_company_name) {
        setCompanyName(data.detected_company_name);
      }
      if (data.detected_job_title) {
        setJobTitle(data.detected_job_title);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating application.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerate = async () => {
    // If in URL mode, URL is provided, but description is empty, auto-fetch first!
    if (inputMode === 'url' && jobUrl.trim() && !jobDescription.trim()) {
      await handleFetchAndTailor();
      return;
    }
    await executeTailor(jobDescription, companyName, jobTitle);
  };

  const handleSaveToTracker = async () => {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    const finalCompanyName = result.detected_company_name || companyName || 'Target Company';
    const finalJobTitle = result.detected_job_title || jobTitle || 'Target Role';

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: finalCompanyName,
          job_title: finalJobTitle,
          job_description: jobDescription,
          cover_letter: result.cover_letter,
          bullet_transformations: result.bullet_transformations,
          missing_skills: result.missing_skills_flagged,
          status: saveStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save application.');
      }

      setSaveSuccess(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
      onApplicationSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save to SQLite database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top action & preset banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/50 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>CIS Application Tailor</span>
            <span className="text-xs font-normal text-slate-400">| Western Michigan University Portfolio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Accepts direct Job URL links or text descriptions. Reframes verified resume facts with zero fabrication.
          </p>
        </div>

        {/* Sample presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Load Target Role:</span>
          <button
            type="button"
            onClick={() => handleLoadSample(0)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition"
            title="Stryker: Associate IT Systems Support Specialist"
          >
            🩺 Med-Tech / Systems (Stryker)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample(1)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition"
            title="Bronson Healthcare: Junior Business Systems & Data Analyst"
          >
            🏥 Healthcare / BSA (Bronson)
          </button>
          <button
            type="button"
            onClick={() => setMasterResume(SAMPLE_MASTER_RESUME)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
            title="Reset to Khushi's Resume"
          >
            <RotateCcw className="w-3 h-3 inline mr-1" />
            Reset Khushi's Resume
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-xs font-medium text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/40 transition"
          >
            Clear Fields
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        {/* Metadata Inputs & Tone Override */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Target Company Name
              </label>
              <span className="text-[10px] text-cyan-400/80 font-medium">Auto-detected from JD</span>
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Leave blank to auto-detect from JD, or type name"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                Target Job Title
              </label>
              <span className="text-[10px] text-cyan-400/80 font-medium">Auto-detected from JD</span>
            </div>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Leave blank to auto-detect from JD, or type title"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Tone Override Control
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setToneMode('auto')}
                className={`py-1.5 px-2 rounded font-medium transition text-center ${
                  toneMode === 'auto'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Auto-Detect from Job Description"
              >
                Auto-Detect
              </button>
              <button
                type="button"
                onClick={() => setToneMode('tech')}
                className={`py-1.5 px-2 rounded font-medium transition text-center ${
                  toneMode === 'tech'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tech / Startup (Concise & Direct)"
              >
                Tech / Startup
              </button>
              <button
                type="button"
                onClick={() => setToneMode('corporate')}
                className={`py-1.5 px-2 rounded font-medium transition text-center ${
                  toneMode === 'corporate'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Corporate / Finance (Formal & Traditional)"
              >
                Corporate
              </button>
            </div>
          </div>
        </div>

        {/* Text Areas / URL Input: Resume vs Job Input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master Resume */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Khushi's Master Resume (Markdown)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {masterResume.length} chars &bull; {masterResume.split('\n').length} lines
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Verified Western Michigan University CIS background, Snipe-IT, OS imaging, and projects.
            </p>
            <textarea
              value={masterResume}
              onChange={(e) => setMasterResume(e.target.value)}
              rows={15}
              placeholder="# Khushi Shrestha..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y flex-1"
            />
          </div>

          {/* Target Job Input (URL Mode vs Manual Text) */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                    inputMode === 'url'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Job URL Link</span>
                  <span className="text-[10px] bg-blue-800/80 text-blue-100 px-1 rounded font-bold">New</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                    inputMode === 'manual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Raw Text Paste</span>
                </button>
              </div>

              {jobDescription && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {jobDescription.length} chars loaded
                </span>
              )}
            </div>

            {/* URL INPUT MODE */}
            {inputMode === 'url' ? (
              <div className="space-y-3.5 flex-1 flex flex-col">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Paste Any Job Posting Link</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supports Greenhouse, Lever, Indeed, Company Portals
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
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
                        placeholder="https://careers.stryker.com/job/... or https://jobs.lever.co/..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                      className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-40"
                    >
                      {isFetchingUrl ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Fetch &amp; Auto-Fill</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sample Job URL Quick Chips */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium mr-1">Test with Sample Link:</span>
                    {SAMPLE_JOB_URLS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadSampleUrl(sample.url)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{sample.company}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fetch Success Message */}
                {urlFetchSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{urlFetchSuccessMessage}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUrlFetchSuccessMessage(null)}
                      className="text-emerald-400 hover:text-white ml-2 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Fetch Error Message with Help */}
                {urlFetchError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-rose-200">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>URL Fetching Notice</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setUrlFetchError(null)}
                        className="text-rose-400 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-rose-300/90 leading-relaxed">{urlFetchError}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInputMode('manual')}
                        className="text-[11px] text-cyan-300 underline font-medium hover:text-cyan-200"
                      >
                        Switch to Raw Text Paste &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Extracted Details Preview & Edit */}
                <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Loaded Job Description Preview</span>
                      {companyName && (
                        <span className="text-[11px] font-normal text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                          {companyName}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                      className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                    >
                      <span>{showExtractedPreview ? 'Collapse' : 'Expand'}</span>
                      {showExtractedPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showExtractedPreview && (
                    <textarea
                      value={jobDescription}
                      onChange={(e) => handleJobDescriptionChange(e.target.value)}
                      rows={8}
                      placeholder="Fetched job description content will appear here automatically..."
                      className="w-full bg-slate-950 p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y flex-1"
                    />
                  )}
                </div>
              </div>
            ) : (
              /* RAW TEXT PASTE MODE */
              <div className="flex-1 flex flex-col">
                <p className="text-xs text-slate-400 mb-2">
                  Paste the full job posting text directly from LinkedIn, Handshake, Indeed, or career portal.
                </p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => handleJobDescriptionChange(e.target.value)}
                  rows={15}
                  placeholder="Paste the target job description here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Guardrails notice & CTA Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Ground-Truth Enforcement:</strong> Strictly uses Khushi's verified WMU experiences. Unmatched skills are flagged.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {inputMode === 'url' && jobUrl.trim() && (
              <button
                type="button"
                disabled={loading || isFetchingUrl}
                onClick={handleFetchAndTailor}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-xs text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 transition disabled:opacity-40"
                title="Fetch from URL and immediately tailor in 1 click"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>⚡ 1-Click: Fetch URL &amp; Tailor</span>
              </button>
            )}

            <button
              type="button"
              disabled={loading || isFetchingUrl}
              onClick={handleGenerate}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-600/30 transition-all ${
                loading
                  ? 'bg-blue-700/60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Analyzing &amp; Tailoring Application...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Tailor Application &amp; Analyze ATS Match</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading state bar */}
        {loading && (
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {loadingStep || 'Processing application...'}
              </span>
              <span className="text-[11px] text-blue-400 font-mono">gemini-3.1-flash-lite @ temp=0.2</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Error message */}
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

      {/* Generated Results Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Section title & tone badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Tailored Results
              </span>
              <h3 className="text-lg font-bold text-white">
                Application Package for {result.detected_company_name || companyName || 'Target Organization'} &ndash; {result.detected_job_title || jobTitle || 'Target Position'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Detected Profile:</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {result.detected_company_type}
              </span>
            </div>
          </div>

          {/* 1. Missing Skills Flagging Warning Banner */}
          <MissingSkillsBanner missingSkills={result.missing_skills_flagged} />

          {/* 2. Resume Bullet Points Side-by-Side Comparison */}
          <BulletComparison bulletTransformations={result.bullet_transformations} />

          {/* 3. 3-Paragraph Tone-Adapted Cover Letter */}
          <CoverLetterCard
            coverLetter={result.cover_letter}
            detectedCompanyType={result.detected_company_type}
            onChangeCoverLetter={(val) =>
              setResult({
                ...result,
                cover_letter: val,
              })
            }
          />

          {/* 4. Save to Tracker Section */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Save This Application to SQLite ATS Tracker</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Persists company, role, JD, 3 tailored bullets, cover letter, and flagged skills to{' '}
                <code className="text-cyan-300 font-mono text-[11px]">applications_tracker.db</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>Initial Status:</span>
                <select
                  value={saveStatus}
                  onChange={(e) => setSaveStatus(e.target.value as ApplicationStatus)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Applied">Applied</option>
                  <option value="Draft">Draft</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer Extended">Offer Extended</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveToTracker}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Application to Tracker</span>
              </button>

              {saveSuccess && (
                <button
                  type="button"
                  onClick={onGoToTracker}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-cyan-500/30 transition"
                >
                  <span>View in Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
