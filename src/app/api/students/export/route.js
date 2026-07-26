import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { error } from '@/lib/apiGuard';
import { buildExport } from '@/lib/excel';

export async function GET() {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  const students = await StudentProfile.find(filter).lean();

  const rows = students.map((s) => ({
    registrationNo: s.registrationNo, name: s.name, email: s.email, programme: s.programme,
    batch: s.batch, currentSemester: s.currentSemester, cgpa: s.latestCGPA, liveBacklogs: s.liveBacklogs,
    placed: (s.placements || []).some((p) => p.type === 'PLACEMENT') ? 'Yes' : 'No',
    higherStudies: (s.placements || []).some((p) => p.type === 'HIGHER_STUDIES') ? 'Yes' : 'No',
    risk: s.riskLevel, status: s.status, parentEmail: s.parentEmail,
  }));

  const buf = await buildExport([{
    sheetName: 'Students',
    columns: [
      { header: 'RegistrationNo', key: 'registrationNo', width: 18 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Programme', key: 'programme', width: 16 },
      { header: 'Batch', key: 'batch', width: 12 },
      { header: 'Sem', key: 'currentSemester', width: 8 },
      { header: 'CGPA', key: 'cgpa', width: 8 },
      { header: 'LiveBacklogs', key: 'liveBacklogs', width: 12 },
      { header: 'Placed', key: 'placed', width: 8 },
      { header: 'HigherStudies', key: 'higherStudies', width: 14 },
      { header: 'Risk', key: 'risk', width: 8 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'ParentEmail', key: 'parentEmail', width: 26 },
    ],
    rows,
  }]);

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="CUTM_Students_Export.xlsx"',
    },
  });
}
