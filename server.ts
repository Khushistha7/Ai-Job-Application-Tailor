import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTailoredApplication } from './server/gemini.ts';
import { extractJobFromUrl } from './server/urlFetcher.ts';
import {
  getAllApplications,
  insertApplication,
  updateApplicationStatus,
  deleteApplication,
  getDb,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Ensure DB is initialized
  await getDb();

  // API Routes
  // Health check endpoint for Cloud Run container lifecycle checks
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 0. Extract Job from URL link
  app.post('/api/extract-job-url', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ error: 'A valid job URL link is required.' });
      }

      const extracted = await extractJobFromUrl(url);
      res.json(extracted);
    } catch (err: any) {
      console.error('Extract job URL error:', err);
      res.status(400).json({ error: err.message || 'Failed to extract job posting from URL.' });
    }
  });

  // 1. Tailor application with Gemini
  app.post('/api/tailor', async (req: Request, res: Response) => {
    try {
      const { master_resume, job_description, company_name, job_title, tone_mode } = req.body;

      if (!master_resume || !master_resume.trim()) {
        return res.status(400).json({ error: 'Master resume text is required.' });
      }
      if (!job_description || !job_description.trim()) {
        return res.status(400).json({ error: 'Job description text is required.' });
      }

      const result = await generateTailoredApplication({
        master_resume,
        job_description,
        company_name: company_name || '',
        job_title: job_title || '',
        tone_mode: tone_mode || 'auto',
      });

      res.json(result);
    } catch (err: any) {
      console.error('Tailor application error:', err);
      res.status(500).json({ error: err.message || 'Failed to tailor application' });
    }
  });

  // 2. Fetch all saved applications
  app.get('/api/applications', async (_req: Request, res: Response) => {
    try {
      const list = await getAllApplications();
      res.json(list);
    } catch (err: any) {
      console.error('Fetch applications error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch applications' });
    }
  });

  // 3. Save application to SQLite
  app.post('/api/applications', async (req: Request, res: Response) => {
    try {
      const {
        company_name,
        job_title,
        job_description,
        cover_letter,
        bullet_transformations,
        missing_skills,
        status,
      } = req.body;

      if (!company_name || !job_title) {
        return res.status(400).json({ error: 'Company name and job title are required.' });
      }

      const id = await insertApplication({
        company_name,
        job_title,
        job_description: job_description || '',
        cover_letter: cover_letter || '',
        bullet_transformations: typeof bullet_transformations === 'string'
          ? bullet_transformations
          : JSON.stringify(bullet_transformations || []),
        missing_skills: typeof missing_skills === 'string'
          ? missing_skills
          : JSON.stringify(missing_skills || []),
        status: status || 'Applied',
      });

      res.status(201).json({ success: true, id });
    } catch (err: any) {
      console.error('Save application error:', err);
      res.status(500).json({ error: err.message || 'Failed to save application' });
    }
  });

  // 4. Update status
  app.patch('/api/applications/:id/status', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (isNaN(id) || !status) {
        return res.status(400).json({ error: 'Valid ID and status are required.' });
      }

      await updateApplicationStatus(id, status);
      res.json({ success: true, id, status });
    } catch (err: any) {
      console.error('Update status error:', err);
      res.status(500).json({ error: err.message || 'Failed to update status' });
    }
  });

  // 5. Delete application
  app.delete('/api/applications/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Valid ID required.' });
      }
      await deleteApplication(id);
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Delete application error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete application' });
    }
  });

  // Vite middleware in dev or static files in prod
  const distPath = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndex);
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development');

  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CIS Job Application Tailor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
