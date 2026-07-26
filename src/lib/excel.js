import ExcelJS from 'exceljs';

// Columns used for the student import/export template.
export const STUDENT_COLUMNS = [
  { header: 'RegistrationNo', key: 'registrationNo', width: 18 },
  { header: 'RollNo', key: 'rollNo', width: 14 },
  { header: 'Name', key: 'name', width: 24 },
  { header: 'Email', key: 'email', width: 26 },
  { header: 'Phone', key: 'phone', width: 14 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Category', key: 'category', width: 10 },
  { header: 'Programme', key: 'programme', width: 18 },
  { header: 'Batch', key: 'batch', width: 12 },
  { header: 'AdmissionYear', key: 'admissionYear', width: 14 },
  { header: 'CurrentSemester', key: 'currentSemester', width: 16 },
  { header: 'Section', key: 'section', width: 10 },
  { header: 'DomicileState', key: 'domicileState', width: 16 },
  { header: 'FatherName', key: 'fatherName', width: 22 },
  { header: 'MotherName', key: 'motherName', width: 22 },
  { header: 'ParentPhone', key: 'parentPhone', width: 14 },
  { header: 'ParentEmail', key: 'parentEmail', width: 26 },
  { header: 'MentorEmail', key: 'mentorEmail', width: 26 },
];

// Build a downloadable, styled import template (with instructions + a sample row).
export async function buildStudentTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CUTM Mentor-Mentee Platform';
  const ws = wb.addWorksheet('Students');

  ws.columns = STUDENT_COLUMNS;
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5D3B' } };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Sample row.
  ws.addRow({
    registrationNo: '2201CSE001',
    rollNo: 'CSE-A-01',
    name: 'Sample Student',
    email: 'sample.student@cutm.ac.in',
    phone: '9000000000',
    gender: 'MALE',
    category: 'GEN',
    programme: 'B.Tech CSE',
    batch: '2022-2026',
    admissionYear: 2022,
    currentSemester: 5,
    section: 'A',
    domicileState: 'Odisha',
    fatherName: 'Father Name',
    motherName: 'Mother Name',
    parentPhone: '9000000001',
    parentEmail: 'parent.sample@gmail.com',
    mentorEmail: 'mentor@cutm.ac.in',
  });

  const notes = wb.addWorksheet('Instructions');
  notes.columns = [{ width: 100 }];
  [
    'CUTM MENTOR-MENTEE — STUDENT IMPORT TEMPLATE',
    '',
    '1. Fill one row per student in the "Students" sheet. Do not rename column headers.',
    '2. RegistrationNo, Name are mandatory. Email is required to issue login credentials.',
    '3. Gender: MALE / FEMALE / OTHER.  Category: GEN / OBC / SC / ST / EWS / OTHER.',
    '4. MentorEmail must match an existing Faculty Mentor account to auto-map the student.',
    '5. ParentEmail is used for the monthly parent meeting invitations.',
    '6. Delete the sample row before importing (or it will be created as a real record).',
    '7. Save as .xlsx and upload from the HoD dashboard → Import Students.',
  ].forEach((t) => notes.addRow([t]));
  notes.getRow(1).font = { bold: true, size: 13 };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Parse an uploaded workbook into an array of plain student objects.
export async function parseStudentWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Students') || wb.worksheets[0];
  if (!ws) return [];

  const headerRow = ws.getRow(1);
  const headers = {};
  headerRow.eachCell((cell, col) => {
    headers[col] = String(cell.value || '').trim();
  });

  const keyByHeader = {};
  STUDENT_COLUMNS.forEach((c) => (keyByHeader[c.header.toLowerCase()] = c.key));

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    row.eachCell((cell, col) => {
      const header = (headers[col] || '').toLowerCase();
      const key = keyByHeader[header];
      if (!key) return;
      let v = cell.value;
      if (v && typeof v === 'object' && 'text' in v) v = v.text; // hyperlink/email cells
      obj[key] = v === null || v === undefined ? '' : String(v).trim();
    });
    if (obj.registrationNo || obj.name) rows.push(obj);
  });
  return rows;
}

// Generic export: array of {columns, rows, sheetName} to an xlsx buffer.
export async function buildExport(sheets) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CUTM Mentor-Mentee Platform';
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.sheetName || 'Sheet1');
    ws.columns = s.columns;
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5D3B' } };
    (s.rows || []).forEach((r) => ws.addRow(r));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
