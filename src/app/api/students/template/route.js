import { requireRole } from '@/lib/apiGuard';
import { buildStudentTemplate } from '@/lib/excel';

export async function GET() {
  const { error: e } = await requireRole('HOD');
  if (e) return e;
  const buf = await buildStudentTemplate();
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="CUTM_Student_Import_Template.xlsx"',
    },
  });
}
