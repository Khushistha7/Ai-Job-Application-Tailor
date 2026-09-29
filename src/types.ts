export type ToneMode = 'auto' | 'tech' | 'corporate';

export type ApplicationStatus = 'Draft' | 'Applied' | 'Interviewing' | 'Offer Extended' | 'Rejected';

export interface BulletTransformation {
  original_bullet: string;
  tailored_bullet: string;
  alignment_reason: string;
}

export interface ApplicationTailorOutput {
  detected_company_name?: string;
  detected_job_title?: string;
  detected_company_type: string;
  cover_letter: string;
  bullet_transformations: BulletTransformation[];
  missing_skills_flagged: string[];
}

export interface ApplicationRecord {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter: string;
  bullet_transformations: string; // JSON string
  missing_skills: string; // JSON string
  status: ApplicationStatus;
  created_at: string;
}
