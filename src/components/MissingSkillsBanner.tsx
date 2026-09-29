import React from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface MissingSkillsBannerProps {
  missingSkills: string[];
}

export const MissingSkillsBanner: React.FC<MissingSkillsBannerProps> = ({ missingSkills }) => {
  if (!missingSkills || missingSkills.length === 0) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-300">
            Full Ground-Truth Alignment Confirmed
          </h4>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            Every primary technical requirement in the target job description is represented in your CIS Master Resume. No unrepresented technologies were detected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 shadow-lg shadow-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <span>Ground-Truth Integrity Alert: {missingSkills.length} Unmatched JD Requirement{missingSkills.length > 1 ? 's' : ''} Flagged</span>
            </h4>
            <span className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Deliberately Excluded from Bullets &amp; Cover Letter
            </span>
          </div>

          <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
            The target job description mentions the following tools or skills which are <span className="font-semibold underline underline-offset-2">not present</span> in your Master Resume. In strict compliance with the CIS Ground-Truth Guardrails, the AI did <strong>not</strong> invent experience with these tools:
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-amber-900/60 text-amber-200 border border-amber-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300/80">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>CIS Candidate Tip:</strong> If you have academic lab or personal project experience with these tools, add them to your Master Resume before re-running!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
