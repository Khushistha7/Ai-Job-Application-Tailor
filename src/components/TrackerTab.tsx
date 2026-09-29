import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Search,
  Filter,
  Plus,
  Calendar,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Trash2,
  ExternalLink,
  ChevronDown,
  X,
  Copy,
  Check,
  Loader2,
  MoreVertical,
  Eye,
  FileText,
  Sparkles,
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
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Status metrics calculation
  const metrics = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === 'Applied').length,
      interviewing: applications.filter((a) => a.status === 'Interviewing').length,
      offer: applications.filter((a) => a.status === 'Offer Extended').length,
      rejected: applications.filter((a) => a.status === 'Rejected').length,
      draft: applications.filter((a) => a.status === 'Draft').length,
    };
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesCompany = app.company_name?.toLowerCase().includes(q);
      const matchesTitle = app.job_title?.toLowerCase().includes(q);
      const matchesDesc = app.job_description?.toLowerCase().includes(q);
      const matchesSkills = app.missing_skills?.toLowerCase().includes(q);

      return matchesStatus && (matchesCompany || matchesTitle || matchesDesc || matchesSkills);
    });
  }, [applications, statusFilter, searchQuery]);

  // Status badge styling helper
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Applied':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'Interviewing':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Offer Extended':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 font-bold';
      case 'Rejected':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
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
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      onRefresh();

      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this tracked application?')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete application');
      if (selectedApp?.id === id) setSelectedApp(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyText = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export handlers
  const handleExportExcel = async () => {
    if (applications.length === 0) return;
    setIsExportingExcel(true);
    setShowExportMenu(false);
    try {
      await exportToStyledExcel(applications);
    } catch (err) {
      console.error('Failed to export Excel workbook:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    const headers = [
      'Application ID',
      'Company Name',
      'Target Job Title',
      'Status',
      'Date Tracked',
      'Bullets Count',
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
        `"${mList.join('; ').replace(/"/g, '""')}"`,
        wCount,
      ];
    });

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

  const handleExportJSON = () => {
    setShowExportMenu(false);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(applications, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Khushi_Shrestha_CIS_Applications_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <span>My Applications</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track and manage your submitted applications, interview stages, and offers.
          </p>
        </div>

        {/* Action Buttons: New Application & More Options (Exports) */}
        <div className="flex items-center gap-2.5">
          {/* Advanced Export Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>More Options</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-30 space-y-0.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={applications.length === 0 || isExportingExcel}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Styled Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={applications.length === 0}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={applications.length === 0}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON Backup</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={onGoToGenerator}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400">Total Applications</span>
          <span className="text-xl font-bold text-white mt-1">{metrics.total}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-blue-400 font-medium">Applied</span>
          <span className="text-xl font-bold text-blue-300 mt-1">{metrics.applied}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-amber-400 font-medium">Interviewing</span>
          <span className="text-xl font-bold text-amber-300 mt-1">{metrics.interviewing}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-emerald-400 font-medium">Offer Extended</span>
          <span className="text-xl font-bold text-emerald-300 mt-1">{metrics.offer}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-rose-400 font-medium">Rejected</span>
          <span className="text-xl font-bold text-rose-300 mt-1">{metrics.rejected}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, job title, skills..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          {['ALL', 'Draft', 'Applied', 'Interviewing', 'Offer Extended', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Application Cards List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No applications found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'You have not saved any tailored applications yet. Create your first one now!'}
          </p>
          <button
            type="button"
            onClick={onGoToGenerator}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm transition mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Application</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredApplications.map((app) => {
            let bulletsCount = 0;
            try {
              const b = JSON.parse(app.bullet_transformations);
              bulletsCount = Array.isArray(b) ? b.length : 0;
            } catch {}

            let missingCount = 0;
            try {
              const m = JSON.parse(app.missing_skills);
              missingCount = Array.isArray(m) ? m.length : 0;
            } catch {}

            return (
              <div
                key={app.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-3 shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white hover:text-blue-300 transition">
                        {app.company_name}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">{app.job_title}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold shrink-0 ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{app.created_at?.slice(0, 10) || 'Recently'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>{bulletsCount} Tailored Bullets</span>
                    {missingCount > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="text-amber-400/80">{missingCount} Missing Skills</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  {/* Status Dropdown Update */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                    className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                    title="Change application status"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Draft">Draft</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer Extended">Offer Extended</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(app)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-xs font-semibold transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      disabled={deletingId === app.id}
                      className="p-1 rounded-md hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
                      title="Delete application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED VIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedApp.company_name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                      selectedApp.status
                    )}`}
                  >
                    {selectedApp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{selectedApp.job_title}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value as ApplicationStatus)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Applied">Status: Applied</option>
                  <option value="Draft">Status: Draft</option>
                  <option value="Interviewing">Status: Interviewing</option>
                  <option value="Offer Extended">Status: Offer Extended</option>
                  <option value="Rejected">Status: Rejected</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 1. Tailored Resume Bullets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>3 Tailored Resume Bullets</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const bList = JSON.parse(selectedApp.bullet_transformations) as BulletTransformation[];
                        const text = bList.map((b) => `• ${b.tailored_bullet}`).join('\n\n');
                        handleCopyText(text, 'all_bullets');
                      } catch {}
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === 'all_bullets' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'all_bullets' ? 'Copied All!' : 'Copy Bullets'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    try {
                      const bList = JSON.parse(selectedApp.bullet_transformations) as BulletTransformation[];
                      return bList.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emerald-300">
                              Tailored Bullet #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(item.tailored_bullet, `b_${idx}`)}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedId === `b_${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                          <p className="text-slate-200 leading-relaxed font-sans">{item.tailored_bullet}</p>
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                            <span className="text-slate-500">Original Resume:</span> {item.original_bullet}
                          </div>
                        </div>
                      ));
                    } catch {
                      return <p className="text-xs text-slate-500">No bullets recorded.</p>;
                    }
                  })()}
                </div>
              </div>

              {/* 2. Cover Letter */}
              {selectedApp.cover_letter && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>3-Paragraph Cover Letter</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedApp.cover_letter, 'modal_cover_letter')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === 'modal_cover_letter' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === 'modal_cover_letter' ? 'Copied!' : 'Copy Letter'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedApp.cover_letter}
                  </div>
                </div>
              )}

              {/* 3. Flagged Missing Skills */}
              {(() => {
                try {
                  const mList = JSON.parse(selectedApp.missing_skills) as string[];
                  if (!mList || mList.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Flagged Missing Skills ({mList.length})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {mList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-950/50 text-amber-200 border border-amber-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              {/* 4. Original Job Description */}
              {selectedApp.job_description && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Job Description Archived
                  </h4>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 max-h-40 overflow-y-auto leading-relaxed">
                    {selectedApp.job_description}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Date Tracked: {selectedApp.created_at?.slice(0, 10)}</span>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
