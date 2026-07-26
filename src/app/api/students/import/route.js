import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import Mapping from '@/models/Mapping';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { parseStudentWorkbook } from '@/lib/excel';
import { provisionUser } from '@/lib/provision';

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();

  const form = await req.formData();
  const file = form.get('file');
  const issueCredentials = form.get('issueCredentials') === 'true';
  if (!file) return error('No file uploaded.');
  const buffer = Buffer.from(await file.arrayBuffer());

  let rows;
  try { rows = await parseStudentWorkbook(buffer); }
  catch (e) { return error('Could not read the Excel file. Use the provided template.'); }

  const summary = { total: rows.length, created: 0, updated: 0, mapped: 0, credentialsIssued: 0, errors: [] };

  for (const [i, r] of rows.entries()) {
    try {
      if (!r.registrationNo || !r.name) { summary.errors.push({ row: i + 2, error: 'Missing RegistrationNo/Name' }); continue; }
      const payload = {
        registrationNo: r.registrationNo, rollNo: r.rollNo, name: r.name, email: (r.email || '').toLowerCase(),
        phone: r.phone, gender: r.gender?.toUpperCase(), category: r.category?.toUpperCase(),
        programme: r.programme, batch: r.batch,
        admissionYear: r.admissionYear ? Number(r.admissionYear) : undefined,
        currentSemester: r.currentSemester ? Number(r.currentSemester) : undefined,
        section: r.section, domicileState: r.domicileState,
        fatherName: r.fatherName, motherName: r.motherName, parentPhone: r.parentPhone, parentEmail: (r.parentEmail || '').toLowerCase(),
        school: session.school, department: session.department, createdBy: session.sub,
      };

      let student = await StudentProfile.findOne({ registrationNo: r.registrationNo });
      if (student) { Object.assign(student, payload); await student.save(); summary.updated++; }
      else { student = await StudentProfile.create(payload); summary.created++; }

      // Issue student login credentials.
      if (issueCredentials && payload.email && !student.user) {
        try {
          const { user } = await provisionUser({
            name: payload.name, email: payload.email, role: 'STUDENT',
            school: session.school, department: session.department, createdBy: session.sub,
          });
          student.user = user._id; await student.save();
          summary.credentialsIssued++;
        } catch { /* email may already exist */ }
      }

      // Map to mentor by email.
      if (r.mentorEmail) {
        const mentor = await User.findOne({ email: r.mentorEmail.toLowerCase(), role: 'MENTOR' });
        if (mentor) {
          await Mapping.updateOne(
            { mentor: mentor._id, student: student._id, academicYear: r.batch || 'current' },
            { $set: { mentor: mentor._id, student: student._id, department: session.department, school: session.school, academicYear: r.batch || 'current', active: true, assignedBy: session.sub } },
            { upsert: true }
          );
          summary.mapped++;
        } else summary.errors.push({ row: i + 2, error: `Mentor not found: ${r.mentorEmail}` });
      }
    } catch (e) {
      summary.errors.push({ row: i + 2, error: e.message });
    }
  }

  return json({ ok: true, summary });
}
