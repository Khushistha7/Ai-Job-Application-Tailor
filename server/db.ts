import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'applications_tracker.db');

export interface ApplicationRecord {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter: string;
  bullet_transformations: string; // JSON string
  missing_skills: string; // JSON string
  status: 'Draft' | 'Applied' | 'Interviewing' | 'Offer Extended' | 'Rejected';
  created_at: string;
}

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Failed reading existing db file, initializing fresh database:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Ensure table exists with exact specified schema
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT NOT NULL,
      cover_letter TEXT NOT NULL,
      bullet_transformations TEXT NOT NULL,
      missing_skills TEXT NOT NULL,
      status TEXT DEFAULT 'Applied',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed with 1 initial sample application if table is brand new
  const countRes = dbInstance.exec('SELECT COUNT(*) as cnt FROM applications');
  const count = countRes[0]?.values[0]?.[0] as number;
  if (count === 0) {
    const sampleBullets = JSON.stringify([
      {
        original_bullet: 'Perform OS imaging and system configuration across labs and offices to maintain consistent, standardized performance',
        tailored_bullet: 'Standardized endpoint reliability and workstation deployment across campus offices and computing labs by executing structured OS imaging, hardware diagnostics, and enterprise system configurations.',
        alignment_reason: 'Directly aligns with Stryker’s requirement for executing standardized OS imaging, device provisioning, and workstation onboarding for new staff members.'
      },
      {
        original_bullet: 'Manage IT asset inventory using Snipe-IT, ensuring accurate tracking and efficient resource allocation',
        tailored_bullet: 'Optimized hardware lifecycle tracking and inventory accountability by administering Snipe-IT asset management, ensuring 100% device traceability and streamlined resource allocation.',
        alignment_reason: 'Maps directly to JD requirement for maintaining accurate IT asset tracking, hardware lifecycle documentation, and enterprise asset inventory systems.'
      },
      {
        original_bullet: 'Planned integration of IT systems including EHR implementation, cybersecurity measures, system testing, and staff training for a $50M outpatient facility',
        tailored_bullet: 'Engineered comprehensive IT systems integration strategy for a $50M healthcare facility, architecting EHR rollout, cybersecurity safeguards, and rigorous user acceptance testing (UAT).',
        alignment_reason: 'Exemplifies collegiate 1st-place award-winning systems planning and healthcare IT readiness directly applicable to Stryker’s medical systems environments.'
      }
    ]);

    const sampleCoverLetter = `Dear Hiring Manager at Stryker Corporation,\n\nI am writing to express my strong enthusiasm for the Associate IT Systems Support Specialist position on the Global IT Infrastructure & Operations team. As a Computer Information Systems senior at Western Michigan University’s Haworth College of Business with a 3.89 GPA, I have developed extensive, practical experience providing multi-platform technical support, standardizing operating system deployments, and managing enterprise IT assets. Having followed Stryker’s industry-leading medical innovations in Southwest Michigan, I am eager to contribute my hands-on technical skills and commitment to operational excellence to your technology operations.\n\nIn my current role as an IT Technician for the WMU College of Health and Human Services, I deliver both on-site and remote hardware and software support, troubleshoot network and endpoint issues, and configure end-user devices for students, faculty, and administrative staff. I routinely perform operating system imaging across computer labs to enforce consistent configurations and actively manage device lifecycles using Snipe-IT to ensure accurate tracking. Furthermore, my academic leadership was recognized with 1st Place at the WMPMI theProject Collegiate Competition for directing the IT infrastructure, cybersecurity, and EHR integration plan for a $50M healthcare facility. These experiences have refined my diagnostic problem-solving abilities and instilled a meticulous approach to technical documentation.\n\nI am confident that my technical foundation in hardware troubleshooting, OS deployment, and asset inventory management, combined with my passion for user enablement, makes me a strong addition to Stryker. Thank you for your time, consideration, and dedication to fostering emerging CIS talent. I welcome the opportunity to discuss in an interview how my skills and proactive work ethic can support your IT infrastructure.`;

    const sampleMissingSkills = JSON.stringify(['PowerShell Scripting', 'Microsoft Intune MDM', 'Active Directory Administration']);

    dbInstance.run(
      `INSERT INTO applications (company_name, job_title, job_description, cover_letter, bullet_transformations, missing_skills, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'))`,
      [
        'Stryker Corporation',
        'Associate IT Systems Support Specialist',
        'Provide Tier 1/Tier 2 technical support for Windows/macOS laptops, execute standardized OS imaging and device provisioning, maintain IT asset tracking using enterprise inventory systems, and author SOPs.',
        sampleCoverLetter,
        sampleBullets,
        sampleMissingSkills,
        'Interviewing',
      ]
    );
  }

  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export async function getAllApplications(): Promise<ApplicationRecord[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM applications ORDER BY created_at DESC');
  const results: ApplicationRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row as unknown as ApplicationRecord);
  }
  stmt.free();
  return results;
}

export async function insertApplication(data: {
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter: string;
  bullet_transformations: string;
  missing_skills: string;
  status?: string;
}): Promise<number> {
  const db = await getDb();
  const status = data.status || 'Applied';
  
  db.run(
    `INSERT INTO applications (company_name, job_title, job_description, cover_letter, bullet_transformations, missing_skills, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      data.company_name,
      data.job_title,
      data.job_description,
      data.cover_letter,
      data.bullet_transformations,
      data.missing_skills,
      status,
    ]
  );

  const res = db.exec('SELECT last_insert_rowid() as id');
  const insertedId = res[0]?.values[0]?.[0] as number;
  persistDb();
  return insertedId;
}

export async function updateApplicationStatus(id: number, status: string): Promise<boolean> {
  const db = await getDb();
  db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
  persistDb();
  return true;
}

export async function deleteApplication(id: number): Promise<boolean> {
  const db = await getDb();
  db.run('DELETE FROM applications WHERE id = ?', [id]);
  persistDb();
  return true;
}
