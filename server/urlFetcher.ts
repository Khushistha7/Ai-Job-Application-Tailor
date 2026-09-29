import * as cheerio from 'cheerio';
import { ai } from './gemini.ts';
import { Type } from '@google/genai';

export interface ExtractedJobDetails {
  company_name: string;
  job_title: string;
  job_description: string;
  source_url: string;
  extraction_method: 'json_ld' | 'gemini_nlp' | 'html_fallback';
}

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  return $.text().replace(/\s+/g, ' ').trim();
}

export async function extractJobFromUrl(targetUrl: string): Promise<ExtractedJobDetails> {
  // 1. Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl.trim());
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('URL must start with http:// or https://');
    }
  } catch (err: any) {
    throw new Error('Please enter a valid web URL (e.g., https://boards.greenhouse.io/...)');
  }

  // 2. Fetch the webpage with realistic headers
  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error(
          `This job board (${parsedUrl.hostname}) restricted automated web fetching (HTTP ${response.status}). Please paste the job description text directly, or try a public job board link (Greenhouse, Lever, Indeed, or direct career portal).`
        );
      }
      throw new Error(`Failed to load webpage from ${parsedUrl.hostname} (HTTP ${response.status})`);
    }

    html = await response.text();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out while fetching the job posting. Please verify the URL or paste the job description text.');
    }
    throw err;
  }

  if (!html || html.trim().length === 0) {
    throw new Error('The URL returned an empty page. Please check the link or paste the text.');
  }

  const $ = cheerio.load(html);

  // 3. Attempt extraction via schema.org JobPosting in JSON-LD (used by Greenhouse, Lever, Workday, Indeed, etc.)
  try {
    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
    for (const el of jsonLdScripts) {
      const content = $(el).html();
      if (!content) continue;
      try {
        const parsed = JSON.parse(content);
        const item = Array.isArray(parsed)
          ? parsed.find((i) => i['@type'] === 'JobPosting' || i['@type']?.includes?.('JobPosting'))
          : parsed['@graph']
          ? parsed['@graph'].find((i: any) => i['@type'] === 'JobPosting')
          : parsed['@type'] === 'JobPosting' || parsed['@type']?.includes?.('JobPosting')
          ? parsed
          : null;

        if (item && item.title) {
          const company =
            typeof item.hiringOrganization === 'string'
              ? item.hiringOrganization
              : item.hiringOrganization?.name || '';
          const title = item.title || '';
          let desc = item.description || '';
          if (desc.includes('<')) {
            desc = stripHtml(desc);
          }

          if (desc && desc.length > 80) {
            return {
              company_name: company.trim(),
              job_title: title.trim(),
              job_description: desc.trim(),
              source_url: targetUrl,
              extraction_method: 'json_ld',
            };
          }
        }
      } catch {
        // Continue to next JSON-LD script or fallback
      }
    }
  } catch (e) {
    console.warn('JSON-LD extraction attempt failed, moving to Gemini NLP parse:', e);
  }

  // 4. Fallback: Clean HTML and use Gemini to parse company, title, and job requirements
  // Remove non-content elements
  $('script, style, noscript, svg, nav, footer, header, iframe, form, button, [role="navigation"], [role="banner"]').remove();

  // Prefer main or article or common job wrappers if present
  let mainText = '';
  const candidateSelectors = [
    'main',
    '#content',
    '#job-description',
    '.job-description',
    '.posting-requirements',
    'article',
    '[data-automation-id="jobPostingDescription"]',
    '.jobs-description__content',
    'body',
  ];

  for (const selector of candidateSelectors) {
    const match = $(selector);
    if (match.length > 0) {
      const text = match.text().replace(/\s+/g, ' ').trim();
      if (text.length > 300) {
        mainText = text;
        break;
      }
    }
  }

  if (!mainText) {
    mainText = $('body').text().replace(/\s+/g, ' ').trim();
  }

  // Truncate to reasonable token limit (~12,000 characters)
  const truncatedText = mainText.slice(0, 12000);

  if (truncatedText.length < 50) {
    throw new Error('Could not extract readable job text from this webpage. Please paste the job description text.');
  }

  // Call Gemini to parse structured job details
  try {
    const prompt = `You are a recruitment data parser. Extract the target Company Name, Job Title, and full Job Description/Requirements from the following webpage text.
Page URL: ${targetUrl}

Webpage text:
"""
${truncatedText}
"""

Instructions:
1. "company_name": Name of the hiring company (if uncertain, infer from URL or page context).
2. "job_title": The exact position or role title.
3. "job_description": The comprehensive job description, responsibilities, requirements, and qualifications. Preserve key technical requirements and tools mentioned.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        company_name: { type: Type.STRING },
        job_title: { type: Type.STRING },
        job_description: { type: Type.STRING },
      },
      required: ['company_name', 'job_title', 'job_description'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      company_name: parsed.company_name?.trim() || '',
      job_title: parsed.job_title?.trim() || '',
      job_description: parsed.job_description?.trim() || truncatedText,
      source_url: targetUrl,
      extraction_method: 'gemini_nlp',
    };
  } catch (nlpErr: any) {
    console.warn('Gemini NLP extraction failed, returning raw cleaned text:', nlpErr);
    // Simple regex fallback for title
    const pageTitle = $('title').text().trim();
    return {
      company_name: '',
      job_title: pageTitle.slice(0, 60),
      job_description: truncatedText,
      source_url: targetUrl,
      extraction_method: 'html_fallback',
    };
  }
}
