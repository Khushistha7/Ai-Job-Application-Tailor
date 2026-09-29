import React, { useState } from 'react';
import { Copy, Check, FileText, Edit3, Eye, Sparkles } from 'lucide-react';

interface CoverLetterCardProps {
  coverLetter: string;
  detectedCompanyType?: string;
  onChangeCoverLetter?: (val: string) => void;
}

export const CoverLetterCard: React.FC<CoverLetterCardProps> = ({
  coverLetter,
  detectedCompanyType,
  onChangeCoverLetter,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const paragraphs = coverLetter
    ? coverLetter.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const wordCount = coverLetter ? coverLetter.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="bg-slate-950/70 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Tailored 3-Paragraph Cover Letter</span>
              <span className="text-[11px] font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ATS Optimized
              </span>
            </h3>
            {detectedCompanyType && (
              <p className="text-[11px] text-slate-400">
                Tone Applied: <span className="text-cyan-300 font-medium">{detectedCompanyType}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Structured View</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Letter</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cover Letter</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5">
        {isEditing ? (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Editable Plain Text (Auto-saves to current session):</span>
              <span>{wordCount} words</span>
            </div>
            <textarea
              value={coverLetter}
              onChange={(e) => onChangeCoverLetter && onChangeCoverLetter(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-sans leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
              placeholder="Cover letter text..."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => {
                const labels = [
                  { title: 'Paragraph 1: Hook & Target Role', desc: 'Introduces CIS candidate, target position, and genuine motivation.' },
                  { title: 'Paragraph 2: Core Experience Alignment', desc: 'Direct mapping of verified projects, tools, and quantified outcomes.' },
                  { title: 'Paragraph 3: Professional Closing & Call to Action', desc: 'Reasserts value delivery, expresses gratitude, and invites interview.' },
                ];
                const meta = labels[idx] || {
                  title: `Paragraph ${idx + 1}`,
                  desc: 'Supporting application detail',
                };

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        {meta.title}
                      </span>
                      <span className="text-[10px] text-slate-500">{meta.desc}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">{p}</p>
                  </div>
                );
              })
            ) : (
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {coverLetter}
              </pre>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Exactly 3 Paragraphs ATS Format
              </span>
              <span>
                {wordCount} words &bull; ~{Math.ceil(wordCount / 200)} min read
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
