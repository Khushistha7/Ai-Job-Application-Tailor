import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  FileText,
  Sparkles,
  Calendar,
  Building2,
  Briefcase,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApplicationRecord, ApplicationStatus, BulletTransformation } from '../types.ts';
import { exportToStyledExcel } from '../utils/excelExport.ts';

interface TrackerTabProps {
  applications: ApplicationRecord[];
  onRefresh: () => void;
  onGoToGenerator: () => void;
}

export const TrackerTab: React.FC<TrackerTabProps> = ({
  applications,
  onRefresh,
  onGoToGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedCoverLetterId, setCopiedCoverLetterId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Status badge styling
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
      case 'Applied':
        return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
      case 'Interviewing':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
      case 'Offer Extended':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 animate-pulse';
      case 'Rejected':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      if (newStatus === 'Offer Extended') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tracked application record?')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete application');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCoverLetter = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoverLetterId(id);
      setTimeout(() => setCopiedCoverLetterId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportExcel = async () => {
    if (applications.length === 0) return;
    setIsExportingExcel(true);
    try {
      await exportToStyledExcel(applications);
    } catch (err) {
      console.error('Failed to export Excel workbook:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(applications, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Khushi_Shrestha_CIS_Applications_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleExportCSV = () => {
    const headers = [
      'Application ID',
      'Company Name',
      'Target Job Title',
      'Status',
      'Date Tracked',
      'Bullets Count',
      'Flagged Missing Skills Count',
      'Flagged Missing Skills Detail',
      'Cover Letter Word Count',
    ];
    const rows = applications.map((app) => {
      let bCount = 0;
      try {
        const bList = JSON.parse(app.bullet_transformations);
        bCount = Array.isArray(bList) ? bList.length : 0;
      } catch {}
      let mList: string[] = [];
      try {
        mList = JSON.parse(app.missing_skills);
      } catch {}
      const wCount = app.cover_letter ? app.cover_letter.trim().split(/\s+/).length : 0;
      return [
        app.id,
        `"${app.company_name.replace(/"/g, '""')}"`,
        `"${app.job_title.replace(/"/g, '""')}"`,
        app.status,
        app.created_at,
        bCount,
        mList.length,
        `"${mList.join('; ').replace(/"/g, '""')}"`,
        wCount,
      ];
    });

    // Add UTF-8 BOM so Excel opens with proper character encoding
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', url);
    dlAnchorElem.setAttribute('download', `Khushi_Shrestha_CIS_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
    URL.revokeObjectURL(url);
  };

  // Filter applications
  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.missing_skills.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;
  const interviewingCount = applications.filter((a) => a.status === 'Interviewing').length;
  const offerCount = applications.filter((a) => a.status === 'Offer Extended').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              <span>Application Tracker Dashboard</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              SQLite Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline backed by <code className="text-cyan-300 font-mono text-[11px]">applications_tracker.db</code>. Export your data to professionally styled spreadsheets.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Styled Excel Workbook (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={applications.length === 0 || isExportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-40"
            title="Download multi-sheet executive Excel workbook with styled headers, status colors, bullets detail & cover letters"
          >
            {isExportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            )}
            <span>Export Styled Excel (.xlsx)</span>
            <span className="hidden sm:inline-block text-[10px] bg-emerald-800/80 px-1.5 py-0.5 rounded text-emerald-100 font-normal">
              4 Sheets
            </span>
          </button>

          {/* Formatted CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition disabled:opacity-40"
            title="Download clean UTF-8 CSV with structured columns"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* JSON Backup */}
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={applications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition disabled:opacity-40"
            title="Download complete JSON database backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tracked</span>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Applied</span>
          <p className="text-2xl font-bold text-blue-300 mt-1">{appliedCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Interviewing</span>
          <p className="text-2xl font-bold text-amber-300 mt-1">{interviewingCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Offers</span>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{offerCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Rejected</span>
          <p className="text-2xl font-bold text-rose-300 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, skill..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses ({applications.length})</option>
            <option value="Draft">Draft</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offer Extended">Offer Extended</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No applications found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {applications.length === 0
                ? 'Your SQLite database is currently empty. Head over to the Application Generator to tailor and save your first CIS application.'
                : 'No tracked applications matched your search or status filter.'}
            </p>
          </div>
          {applications.length === 0 && (
            <button
              type="button"
              onClick={onGoToGenerator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailor First Application</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            let bulletList: BulletTransformation[] = [];
            let missingList: string[] = [];

            try {
              bulletList = JSON.parse(app.bullet_transformations);
            } catch (e) {
              console.error('Failed to parse bullet transformations', e);
            }

            try {
              missingList = JSON.parse(app.missing_skills);
            } catch (e) {
              console.error('Failed to parse missing skills', e);
            }

            const formattedDate = new Date(app.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={app.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700/80 transition"
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-sm">
                      {app.company_name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {app.company_name}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                          {app.job_title}
                        </span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formattedDate}
                        </span>
                        {missingList.length > 0 && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {missingList.length} skill{missingList.length > 1 ? 's' : ''} flagged
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2.5 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Status:</span>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer Extended">Offer Extended</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCoverLetter(app.id, app.cover_letter)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
                      title="Copy Cover Letter"
                    >
                      {copiedCoverLetterId === app.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Cover Letter</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-xs font-medium text-blue-300 border border-blue-500/30 transition"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Package'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      disabled={deletingId === app.id}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/40 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanding Drawer Section */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Missing skills alert if any */}
                    {missingList.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1.5">
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Flagged Unmatched JD Skills (Excluded from Application):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {missingList.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/30 font-mono text-[11px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bullet Transformations */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Saved Bullet Transformations (Original vs. Tailored)</span>
                      </h4>

                      <div className="space-y-3">
                        {bulletList.map((item, bIdx) => (
                          <div
                            key={bIdx}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                  Original Resume Bullet
                                </span>
                                <p className="text-slate-300">&ldquo;{item.original_bullet}&rdquo;</p>
                              </div>
                              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-500/30">
                                <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">
                                  Tailored ATS Action Bullet
                                </span>
                                <p className="text-blue-100 font-medium">&bull; {item.tailored_bullet}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                              <strong className="text-slate-300">Alignment:</strong> {item.alignment_reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3-Paragraph Cover Letter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Saved 3-Paragraph Cover Letter</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopyCoverLetter(app.id, app.cover_letter)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700 transition"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy Letter</span>
                        </button>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {app.cover_letter}
                      </div>
                    </div>

                    {/* Target Job Description toggle */}
                    <details className="text-xs group">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-medium py-1">
                        View Target Job Description
                      </summary>
                      <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                        {app.job_description}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
