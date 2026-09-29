import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface BulletTransformation {
  original_bullet: string;
  tailored_bullet: string;
  alignment_reason: string;
}

export interface ApplicationTailorOutput {
  detected_company_name: string;
  detected_job_title: string;
  detected_company_type: string;
  cover_letter: string;
  bullet_transformations: BulletTransformation[];
  missing_skills_flagged: string[];
}

export interface TailorRequest {
  master_resume: string;
  job_description: string;
  company_name: string;
  job_title: string;
  tone_mode: 'auto' | 'tech' | 'corporate';
}

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return cleaned;
}

async function executeWithRetry<T>(
  action: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`Transient API error (${err.message}). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

export async function generateTailoredApplication(params: TailorRequest): Promise<ApplicationTailorOutput> {
  const { master_resume, job_description, company_name, job_title, tone_mode } = params;

  let toneDirective = '';
  if (tone_mode === 'tech') {
    toneDirective = 'Adopt a Tech / Startup tone: concise, direct, impact-focused, and confident.';
  } else if (tone_mode === 'corporate') {
    toneDirective = 'Adopt a Corporate / Finance tone: formal, polished, respectful, structured, and traditional.';
  } else {
    toneDirective = 'Auto-detect company atmosphere from the Job Description (e.g., Tech/Startup vs. Corporate/Enterprise/Finance) and adapt the tone accordingly. State the detected type in `detected_company_type`.';
  }

  const systemInstruction = `You are an expert ATS Optimization and Career Advisor specializing in Computer Information Systems (CIS) undergraduate students entering the US job market.

ABSOLUTE GROUND-TRUTH GUARDRAILS:
1. STRICT GROUND-TRUTH RULE: You must strictly reframe, rewrite, or re-prioritize experiences, metrics, projects, and tools PRESENT IN THE MASTER RESUME. You must NEVER fabricate, invent, hallucinate, or assume any technical tools, programming languages, cloud platforms, databases, certifications, metrics, or experiences not explicitly documented in the resume text.
2. MISSING SKILLS FLAGGING: If the target Job Description (JD) requests a tool, framework, protocol, credential, or skill that is ABSENT from the Master Resume, you must extract and flag it in the "missing_skills_flagged" array. You must NEVER append, inject, or sneak missing skills into bullet points or the cover letter!
3. COMPANY AND TITLE IDENTIFICATION:
   - Carefully read the target Job Description (JD) provided.
   - Extract the real target hiring company name as "detected_company_name" and the exact position title as "detected_job_title".
   - If the user provided a company name or job title, verify if it matches the JD. If the user provided text from a different job description (or left blank/default values), ALWAYS prioritize the actual hiring company and job title specified within the provided Job Description text itself!
   - Under NO circumstance should you use "Stryker Corporation" or "Associate IT Systems Support Specialist" unless the provided Job Description is actually for Stryker Corporation!
4. RESUME BULLET POINTS SPECIFICATION:
   - Select and produce EXACTLY 3 tailored bullet points.
   - Each item must map directly to an identifiable original bullet point in the Master Resume.
   - "original_bullet": verbatim or near-verbatim bullet as written in the Master Resume.
   - "tailored_bullet": optimized using strong action verbs, quantifiable metrics, and ATS keywords from the JD that legitimately apply to what the candidate actually did. No fabricated tools or figures.
   - "alignment_reason": 1-2 concise sentences explaining why this bullet directly answers specific requirements in the JD.
5. COVER LETTER SPECIFICATION:
   - Must consist of EXACTLY 3 paragraphs separated by double newlines.
   - Paragraph 1: Enthusiastic Hook & target role introduction referencing the actual hiring company (detected_company_name) and target position (detected_job_title), summarizing candidate's CIS undergraduate background and motivation.
   - Paragraph 2: Core Experience Alignment using ONLY verified facts, projects, and technologies from the Master Resume that address the JD's primary technical needs.
   - Paragraph 3: Professional closing, reaffirming genuine value addition, gratitude, and a confident call to action for an interview.
   - Tone: ${toneDirective}

Remember: Honesty and ATS compliance are paramount. Do not embellish beyond the provided resume text.`;

  const prompt = `Candidate Master Resume:
"""
${master_resume}
"""

User Supplied Company Hint (may be blank or default): "${company_name || ''}"
User Supplied Job Title Hint (may be blank or default): "${job_title || ''}"
Tone Preference: ${tone_mode}

Target Job Description (JD):
"""
${job_description}
"""

Analyze the master resume and job description. Accurately identify the actual hiring company and job title from the JD. Provide the structured JSON output adhering to all ground-truth rules.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      detected_company_name: {
        type: Type.STRING,
        description: 'The actual hiring organization/company name identified directly from the Job Description text. If the company is not explicitly named, identify the organization or industry entity.',
      },
      detected_job_title: {
        type: Type.STRING,
        description: 'The exact position or job title for the role identified from the Job Description text.',
      },
      detected_company_type: {
        type: Type.STRING,
        description: 'Detected company profile or tone applied, e.g. "Tech / High-Growth Startup (Concise & Direct)" or "Corporate / Enterprise (Formal & Traditional)".',
      },
      cover_letter: {
        type: Type.STRING,
        description: 'Exactly 3 paragraphs separated by double newlines (Paragraph 1: Hook & role with actual company, Paragraph 2: Real resume experience alignment, Paragraph 3: Professional closing & CTA).',
      },
      bullet_transformations: {
        type: Type.ARRAY,
        description: 'Exactly 3 bullet transformations mapped directly to original resume bullets.',
        items: {
          type: Type.OBJECT,
          properties: {
            original_bullet: {
              type: Type.STRING,
              description: 'The exact or near-verbatim original bullet point from the Master Resume.',
            },
            tailored_bullet: {
              type: Type.STRING,
              description: 'The reframed, ATS-optimized bullet point using ONLY factual details from the resume.',
            },
            alignment_reason: {
              type: Type.STRING,
              description: 'Clear rationale explaining how this reframing aligns with specific requirements in the JD.',
            },
          },
          required: ['original_bullet', 'tailored_bullet', 'alignment_reason'],
        },
      },
      missing_skills_flagged: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Array of technical skills, tools, or qualifications requested in the JD that are NOT present in the master resume.',
      },
    },
    required: ['detected_company_name', 'detected_job_title', 'detected_company_type', 'cover_letter', 'bullet_transformations', 'missing_skills_flagged'],
  };

  // Prioritize gemini-3.1-flash-lite as primary high-availability model to prevent 503 high-demand errors
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const result = await executeWithRetry(async () => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const rawText = response.text;
        if (!rawText) throw new Error(`Model ${model} returned empty response`);
        const cleaned = cleanJsonText(rawText);
        return JSON.parse(cleaned) as ApplicationTailorOutput;
      }, 1, 1000);

      return result;
    } catch (err: any) {
      console.warn(`Model ${model} encountered an issue: ${err.message}. Trying next available model...`);
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || 'AI service temporarily unavailable. Please try again in a few moments.'
  );
}
