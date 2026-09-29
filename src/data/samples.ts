export interface SampleJob {
  company: string;
  title: string;
  tone: 'auto' | 'tech' | 'corporate';
  description: string;
  notes: string;
}

export const SAMPLE_MASTER_RESUME = `# Khushi Shrestha
**Email:** khushi.shrestha@wmich.edu | **Phone:** 754-297-9263 | **LinkedIn:** linkedin.com/in/khushi-shrestha

---

### EDUCATION
**Western Michigan University – Haworth College of Business**
*BBA in Computer Information Systems | Minor: General Business*
* **GPA:** 3.89 / 4.00
* **Expected Graduation:** Fall 2026

---

### SKILLS
* **IT Support & Systems:** Hardware & Software Troubleshooting, OS Imaging, System Deployment, Device Configuration, Printer & AV Support
* **Systems & Tools:** Snipe-IT, SQL Server Management Studio (SSMS), Salesforce CRM, Microsoft Office, Google Workspace, Visio
* **Databases & Data Analytics:** SQL (SELECT, JOIN, GROUP BY), Excel, Power BI, Microsoft Access
* **Professional & Operational:** Technical Documentation, Asset Inventory Management, User Training & Onboarding, Confidentiality & Compliance

---

### EXPERIENCE

#### IT Technician | WMU College of Health and Human Services
*August 2025 – Present | Kalamazoo, MI*
* Provide on-site and remote technical support, resolving hardware, software, and system issues for faculty, staff, and students.
* Install, configure, and deploy laptops and end-user devices, including system setup, software installation, and user onboarding.
* Perform OS imaging and system configuration across labs and offices to maintain consistent, standardized performance.
* Manage IT asset inventory using Snipe-IT, ensuring accurate tracking and efficient resource allocation.
* Troubleshoot printers, classroom technology, and AV equipment to ensure uninterrupted daily operations.
* Maintain technical documentation for equipment, software, and support procedures in accordance with IT standards.

#### Peer Navigator | WMU Student Success Services
*April 2025 – Present | Kalamazoo, MI*
* Manage student engagement data using Salesforce CRM, ensuring accurate tracking and timely follow-ups for 100+ students.
* Maintain confidentiality and professionalism while delivering consistent, high-quality service to a diverse population.

#### International Student Orientation Leader | Western Michigan University
*Fall 2025 – Fall 2026 | Kalamazoo, MI*
* Delivered training and guidance to incoming international students across two orientation cycles, communicating campus procedures and resources clearly.

#### Office Support Assistant | Swastik Shree Enterprise
*May 2024 – July 2024 | Kathmandu, Nepal*
* Built Excel-based tracking systems for orders and reporting; organized records to improve data accessibility and workflow efficiency.

---

### PROJECTS

#### Power BI Car Rental Market Analysis | Academic Project
* Cleaned and transformed datasets, created DAX measures, and built an interactive dashboard using maps, treemaps, slicers, and KPI cards to analyze rental rates and market trends.

#### Healthcare Facility Project Management Plan – WMHP Outpatient Center
*January 2026 – April 2026*
* Planned integration of IT systems including EHR implementation, cybersecurity measures, system testing, and staff training for a $50M outpatient facility.
* Awarded 1st Place for Best Project at the WMPMI theProject Collegiate Competition 2026.

---

### ACTIVITIES & LEADERSHIP
* **WMU International Student Council** (August 2024 – Present): *Director of Cultural RSOs* – Maintain event documentation using Microsoft Teams; design presentations and materials using Canva and PowerPoint.
* **WMU Nepalese Student Association** (August 2025 – Present): *Vice President* – Manage club operations and coordinate cultural events including logistics, scheduling, and communication.

---

### AWARDS & HONORS
* Haworth College of Business Dean's List (Fall 2024, Spring 2024, Fall 2025, Spring 2025)
* Department of Business Information Systems Scholarship (2025–2026)
* Mehi Scholarship (2025–2026)
* Professor J. Michael and Mrs. Lee Tarn Scholarship (2026–2027)
`;

export const SAMPLE_JOBS: SampleJob[] = [
  {
    company: 'Stryker Corporation',
    title: 'Associate IT Systems Support Specialist',
    tone: 'tech',
    notes: 'Med-tech global leader looking for endpoint management, OS imaging, hardware diagnostics, and IT asset inventory tracking.',
    description: `About the Role:
Stryker is one of the world's leading medical technology companies. We are seeking an Associate IT Systems Support Specialist to join our Global IT Infrastructure & Operations team. You will be responsible for ensuring seamless hardware, software, and device deployment for campus employees and technical facilities.

Key Responsibilities:
- Provide Tier 1/Tier 2 on-site and remote technical support for Windows/macOS laptops, peripherals, and clinical systems.
- Execute standardized OS imaging, device provisioning, and workstation onboarding for new staff members.
- Maintain accurate IT asset tracking and lifecycle documentation using enterprise asset inventory systems.
- Troubleshoot network connectivity, endpoint applications, classroom/meeting room AV setups, and multi-function printers.
- Author clear standard operating procedures (SOPs) and technical documentation for IT support procedures.
- Participate in device modernization rollouts and system testing across healthcare/enterprise environments.

Qualifications:
- Bachelor's degree (or currently pursuing) in Computer Information Systems (CIS), Information Technology, or related discipline (Expected graduation 2025/2026).
- Hands-on experience with hardware/software troubleshooting, OS deployment, and system configuration.
- Familiarity with asset inventory management tools (e.g., Snipe-IT or ServiceNow) and relational database concepts.
- Demonstrated technical documentation, customer service, and problem-solving skills.
- Bonus/Nice-to-Have: Experience with PowerShell scripting, Microsoft Intune MDM, and Active Directory user administration.`,
  },
  {
    company: 'Bronson Healthcare Group',
    title: 'Junior Business Systems & Healthcare Data Analyst',
    tone: 'corporate',
    notes: 'Regional healthcare system looking for EHR integration, Salesforce/CRM tracking, Power BI dashboards, and SQL reporting.',
    description: `Position: Junior Business Systems & Healthcare Data Analyst
Organization: Bronson Healthcare Group – Information Technology Services
Location: Kalamazoo, MI (Hybrid)

Role Summary:
Bronson Healthcare is seeking a detail-driven Junior Business Systems Analyst to support clinical and administrative application systems. You will assist in system integration, stakeholder reporting, and CRM user engagement tracking.

Key Responsibilities:
- Partner with clinical stakeholders and IT leadership to support IT system integration, including Electronic Health Records (EHR) workflows and outpatient systems.
- Build interactive Power BI and Excel dashboards to visualize operational KPIs, patient service metrics, and system utilization trends.
- Query SQL databases (SSMS) using SELECT, JOIN, and GROUP BY to extract data, audit records, and resolve reporting discrepancies.
- Support user engagement workflows and customer data integrity utilizing Salesforce CRM.
- Document business requirements, technical specifications, and system testing procedures adhering to healthcare compliance and patient data confidentiality standards.

Requirements:
- Pursuing or completed Bachelor's in Computer Information Systems (CIS), Business Information Systems, or Healthcare Informatics.
- Proven coursework or project experience in relational databases and SQL queries.
- Hands-on experience building business intelligence dashboards in Power BI and creating DAX calculations.
- Familiarity with CRM systems (Salesforce) and technical project management frameworks.
- Preferred: Understanding of HIPAA compliance, Epic EHR workflows, and Tableau visualization.`,
  },
];

export interface SampleJobUrl {
  name: string;
  company: string;
  url: string;
  badge: string;
}

export const SAMPLE_JOB_URLS: SampleJobUrl[] = [
  {
    name: 'IT Support & Systems Specialist',
    company: 'Stryker Careers',
    url: 'https://careers.stryker.com/',
    badge: 'Med-Tech Kalamazoo',
  },
  {
    name: 'Healthcare Systems & EHR Analyst',
    company: 'Bronson Health',
    url: 'https://www.bronsonhealth.com/careers/',
    badge: 'Healthcare IT',
  },
  {
    name: 'Cloud & Infrastructure Analyst',
    company: 'RemoteOK Tech',
    url: 'https://remoteok.com/',
    badge: 'Fast Tech Board',
  },
];

