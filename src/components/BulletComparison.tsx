import React, { useState } from 'react';
import { Copy, Check, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { BulletTransformation } from '../types.ts';

interface BulletComparisonProps {
  bulletTransformations: BulletTransformation[];
}

export const BulletComparison: React.FC<BulletComparisonProps> = ({ bulletTransformations }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopySingle = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCopyAll = async () => {
    try {
      const fullText = bulletTransformations
        .map((b, i) => `• ${b.tailored_bullet}`)
        .join('\n\n');
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (e) {
      console.error('Failed to copy all', e);
    }
  };

  if (!bulletTransformations || bulletTransformations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Targeted Resume Bullet Transformations (Exactly 3)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Ground-truth mapped from your Master Resume, reframed with high-impact action verbs and ATS keywords.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">All 3 Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy All 3 Bullets</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {bulletTransformations.map((item, idx) => {
          const isCopied = copiedIndex === idx;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700/80 transition"
            >
              {/* Header badge */}
              <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  Transformation #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    ATS Aligned
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(item.tailored_bullet, idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Tailored</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Side-by-side or stacked grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Original bullet */}
                <div className="bg-slate-950/40 rounded-lg p-3.5 border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Original Master Resume Bullet
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Unmodified</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      &ldquo;{item.original_bullet}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Right: Tailored bullet */}
                <div className="bg-blue-950/20 rounded-lg p-3.5 border border-blue-500/30 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Tailored ATS Action Bullet
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Optimized
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 font-medium leading-relaxed font-sans">
                      &bull; {item.tailored_bullet}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alignment reason callout */}
              <div className="bg-slate-950/80 px-4 py-2.5 border-t border-slate-800/60 text-xs flex items-start gap-2 text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300">JD Alignment Strategy:</strong>{' '}
                  <span className="text-slate-400">{item.alignment_reason}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
