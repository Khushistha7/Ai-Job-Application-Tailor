import ExcelJS from 'exceljs';
import { ApplicationRecord, BulletTransformation } from '../types.ts';

export async function exportToStyledExcel(applications: ApplicationRecord[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CIS Job Application Tailor & ATS Tracker';
  workbook.lastModifiedBy = 'Khushi Shrestha';
  workbook.created = new Date();
  workbook.modified = new Date();

  // -------------------------------------------------------------
  // TAB 1: PIPELINE OVERVIEW
  // -------------------------------------------------------------
  const overviewSheet = workbook.addWorksheet('Pipeline Overview', {
    views: [{ showGridLines: true }],
  });

  // Title Row
  overviewSheet.mergeCells('A1:I1');
  const titleCell = overviewSheet.getCell('A1');
  titleCell.value = 'KHUSHI SHRESTHA — CIS JOB APPLICATION & ATS TRACKER';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate 900
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  overviewSheet.getRow(1).height = 36;

  // Subtitle Row
  overviewSheet.mergeCells('A2:I2');
  const subtitleCell = overviewSheet.getCell('A2');
  subtitleCell.value = `Exported from SQLite applications_tracker.db on ${new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} | Western Michigan University CIS Portfolio`;
  subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate 800
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  overviewSheet.getRow(2).height = 22;

  // KPI Summary Row (Row 4)
  const totalApps = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;
  const interviewCount = applications.filter((a) => a.status === 'Interviewing').length;
  const offerCount = applications.filter((a) => a.status === 'Offer Extended').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  overviewSheet.getCell('A4').value = 'Total Applications';
  overviewSheet.getCell('A5').value = totalApps;
  overviewSheet.getCell('C4').value = 'Applied';
  overviewSheet.getCell('C5').value = appliedCount;
  overviewSheet.getCell('E4').value = 'Interviewing';
  overviewSheet.getCell('E5').value = interviewCount;
  overviewSheet.getCell('G4').value = 'Offer Extended';
  overviewSheet.getCell('G5').value = offerCount;
  overviewSheet.getCell('I4').value = 'Rejected';
  overviewSheet.getCell('I5').value = rejectedCount;

  const kpiPairs = [
    { labelCell: 'A4', valCell: 'A5', color: 'FF1E40AF' }, // Blue
    { labelCell: 'C4', valCell: 'C5', color: 'FF0284C7' }, // Cyan
    { labelCell: 'E4', valCell: 'E5', color: 'FFD97706' }, // Amber
    { labelCell: 'G4', valCell: 'G5', color: 'FF059669' }, // Emerald
    { labelCell: 'I4', valCell: 'I5', color: 'FFE11D48' }, // Rose
  ];

  for (const pair of kpiPairs) {
    const lCell = overviewSheet.getCell(pair.labelCell);
    const vCell = overviewSheet.getCell(pair.valCell);

    lCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
    lCell.alignment = { horizontal: 'center', vertical: 'middle' };
    lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

    vCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: pair.color } };
    vCell.alignment = { horizontal: 'center', vertical: 'middle' };
    vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    lCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    vCell.border = { bottom: { style: 'medium', color: { argb: pair.color } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  }

  overviewSheet.getRow(4).height = 18;
  overviewSheet.getRow(5).height = 24;

  // Table Headers (Row 7)
  const headers = [
    'ID',
    'Company Name',
    'Target Job Title',
    'Application Status',
    'Date Tracked',
    'Bullets Generated',
    'Missing Skills Flagged',
    'Flagged Skills Detail',
    'Cover Letter Word Count',
  ];

  const headerRow = overviewSheet.getRow(7);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 3 || idx === 4 || idx === 5 || idx === 6 || idx === 8 ? 'center' : 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    };
  });

  // Table Data Rows
  applications.forEach((app, rowIdx) => {
    let bulletCount = 0;
    try {
      const bList = JSON.parse(app.bullet_transformations);
      bulletCount = Array.isArray(bList) ? bList.length : 0;
    } catch {
      bulletCount = 0;
    }

    let missingList: string[] = [];
    try {
      missingList = JSON.parse(app.missing_skills);
    } catch {
      missingList = [];
    }

    const wordCount = app.cover_letter ? app.cover_letter.trim().split(/\s+/).length : 0;
    const dateFormatted = new Date(app.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const dataRow = overviewSheet.getRow(8 + rowIdx);
    dataRow.height = 24;

    const rowValues = [
      app.id,
      app.company_name,
      app.job_title,
      app.status,
      dateFormatted,
      bulletCount,
      missingList.length,
      missingList.join(', ') || 'None (Full Match)',
      wordCount,
    ];

    const isEven = rowIdx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    rowValues.forEach((val, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment
      if (colIdx === 0 || colIdx === 4 || colIdx === 5 || colIdx === 6 || colIdx === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Status formatting
      if (colIdx === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (app.status === 'Offer Extended') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else if (app.status === 'Interviewing') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else if (app.status === 'Applied') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        } else if (app.status === 'Rejected') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF9F1239' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
        } else {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
      }
    });
  });

  // Column Widths for Sheet 1
  overviewSheet.getColumn(1).width = 8; // ID
  overviewSheet.getColumn(2).width = 28; // Company
  overviewSheet.getColumn(3).width = 34; // Job Title
  overviewSheet.getColumn(4).width = 18; // Status
  overviewSheet.getColumn(5).width = 15; // Date Tracked
  overviewSheet.getColumn(6).width = 18; // Bullets
  overviewSheet.getColumn(7).width = 22; // Missing Count
  overviewSheet.getColumn(8).width = 40; // Missing Detail
  overviewSheet.getColumn(9).width = 22; // Word Count

  // -------------------------------------------------------------
  // TAB 2: TAILORED BULLETS DETAIL
  // -------------------------------------------------------------
  const bulletsSheet = workbook.addWorksheet('Tailored Bullets Detail', {
    views: [{ showGridLines: true }],
  });

  // Bullets Title
  bulletsSheet.mergeCells('A1:G1');
  const bTitle = bulletsSheet.getCell('A1');
  bTitle.value = 'ATS RESUME BULLET TRANSFORMATIONS — GROUND-TRUTH VERIFIED';
  bTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  bTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Teal 700
  bTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  bulletsSheet.getRow(1).height = 32;

  // Bullets Headers
  const bHeaders = [
    'App ID',
    'Company Name',
    'Target Job Title',
    'Bullet #',
    'Original Master Resume Bullet',
    'Tailored ATS Action Bullet',
    'JD Alignment Strategy & Rationale',
  ];

  const bHeaderRow = bulletsSheet.getRow(3);
  bHeaderRow.height = 26;
  bHeaders.forEach((h, idx) => {
    const cell = bHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } }; // Dark Teal
    cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 3 ? 'center' : 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF2DD4BF' } },
      right: { style: 'thin', color: { argb: 'FF2DD4BF' } },
    };
  });

  let bulletRowIdx = 4;
  applications.forEach((app) => {
    let bulletList: BulletTransformation[] = [];
    try {
      bulletList = JSON.parse(app.bullet_transformations);
    } catch {
      bulletList = [];
    }

    bulletList.forEach((b, bIdx) => {
      const row = bulletsSheet.getRow(bulletRowIdx);
      row.height = 42; // generous height for wrapped text

      const isEven = bulletRowIdx % 2 === 0;
      const bg = isEven ? 'FFFFFFFF' : 'FFF0FDFA';

      const vals = [
        app.id,
        app.company_name,
        app.job_title,
        `Transformation #${bIdx + 1}`,
        b.original_bullet,
        b.tailored_bullet,
        b.alignment_reason,
      ];

      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          vertical: 'top',
          horizontal: cIdx === 0 || cIdx === 3 ? 'center' : 'left',
          wrapText: cIdx >= 4,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          bottom: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          left: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          right: { style: 'thin', color: { argb: 'FFCCFBF1' } },
        };
      });

      bulletRowIdx++;
    });
  });

  bulletsSheet.getColumn(1).width = 9;
  bulletsSheet.getColumn(2).width = 24;
  bulletsSheet.getColumn(3).width = 28;
  bulletsSheet.getColumn(4).width = 18;
  bulletsSheet.getColumn(5).width = 45;
  bulletsSheet.getColumn(6).width = 50;
  bulletsSheet.getColumn(7).width = 45;

  // -------------------------------------------------------------
  // TAB 3: COVER LETTERS
  // -------------------------------------------------------------
  const letterSheet = workbook.addWorksheet('Cover Letters', {
    views: [{ showGridLines: true }],
  });

  letterSheet.mergeCells('A1:E1');
  const lTitle = letterSheet.getCell('A1');
  lTitle.value = 'TAILORED 3-PARAGRAPH COVER LETTERS — FULL TEXT ARCHIVE';
  lTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  lTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }; // Indigo 700
  lTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  letterSheet.getRow(1).height = 32;

  const lHeaders = ['App ID', 'Company Name', 'Target Job Title', 'Status', 'Full 3-Paragraph Cover Letter Text'];
  const lHeaderRow = letterSheet.getRow(3);
  lHeaderRow.height = 26;
  lHeaders.forEach((h, idx) => {
    const cell = lHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } }; // Dark Indigo
    cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 3 ? 'center' : 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      left: { style: 'thin', color: { argb: 'FF818CF8' } },
      right: { style: 'thin', color: { argb: 'FF818CF8' } },
    };
  });

  applications.forEach((app, idx) => {
    const row = letterSheet.getRow(4 + idx);
    row.height = 90; // extra height for multi-paragraph cover letter

    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFEEF2FF';

    const vals = [app.id, app.company_name, app.job_title, app.status, app.cover_letter];

    vals.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = {
        vertical: 'top',
        horizontal: cIdx === 0 || cIdx === 3 ? 'center' : 'left',
        wrapText: cIdx === 4,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E7FF' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E7FF' } },
        left: { style: 'thin', color: { argb: 'FFE0E7FF' } },
        right: { style: 'thin', color: { argb: 'FFE0E7FF' } },
      };
    });
  });

  letterSheet.getColumn(1).width = 9;
  letterSheet.getColumn(2).width = 26;
  letterSheet.getColumn(3).width = 30;
  letterSheet.getColumn(4).width = 16;
  letterSheet.getColumn(5).width = 85;

  // -------------------------------------------------------------
  // TAB 4: MISSING SKILLS & LEARNING ROADMAP
  // -------------------------------------------------------------
  const skillsSheet = workbook.addWorksheet('Missing Skills Roadmap', {
    views: [{ showGridLines: true }],
  });

  skillsSheet.mergeCells('A1:D1');
  const sTitle = skillsSheet.getCell('A1');
  sTitle.value = 'FLAGGED MISSING SKILLS AUDIT & CIS LEARNING ROADMAP';
  sTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }; // Amber 700
  sTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  skillsSheet.getRow(1).height = 32;

  const sHeaders = [
    'Flagged Skill / Tool from JD',
    'Target Company & Role',
    'Detection Status',
    'Candidate Action Plan & Recommendation',
  ];
  const sHeaderRow = skillsSheet.getRow(3);
  sHeaderRow.height = 26;
  sHeaders.forEach((h, idx) => {
    const cell = sHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF78350F' } }; // Dark Amber
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF451A03' } },
      bottom: { style: 'medium', color: { argb: 'FF451A03' } },
      left: { style: 'thin', color: { argb: 'FFFCD34D' } },
      right: { style: 'thin', color: { argb: 'FFFCD34D' } },
    };
  });

  let sRowIdx = 4;
  applications.forEach((app) => {
    let missingList: string[] = [];
    try {
      missingList = JSON.parse(app.missing_skills);
    } catch {
      missingList = [];
    }

    missingList.forEach((skill) => {
      const row = skillsSheet.getRow(sRowIdx);
      row.height = 24;

      const isEven = sRowIdx % 2 === 0;
      const bg = isEven ? 'FFFFFFFF' : 'FFFFFBEB';

      const vals = [
        skill,
        `${app.company_name} — ${app.job_title}`,
        'Excluded from Resume & Cover Letter to protect Ground-Truth integrity',
        'Add to Master Resume if covered in CIS coursework, personal labs, or micro-certifications.',
      ];

      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFEF3C7' } },
          bottom: { style: 'thin', color: { argb: 'FFFEF3C7' } },
          left: { style: 'thin', color: { argb: 'FFFEF3C7' } },
          right: { style: 'thin', color: { argb: 'FFFEF3C7' } },
        };
      });

      sRowIdx++;
    });
  });

  skillsSheet.getColumn(1).width = 30;
  skillsSheet.getColumn(2).width = 40;
  skillsSheet.getColumn(3).width = 50;
  skillsSheet.getColumn(4).width = 65;

  // Generate buffer and trigger file download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Khushi_Shrestha_CIS_Applications_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
