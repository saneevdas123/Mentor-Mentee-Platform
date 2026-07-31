import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';

/**
 * Can this session view/act on a given student record?
 * ADMIN: all · DEAN: same school · HOD: same department · MENTOR: mapped · STUDENT: self.
 */
export async function canAccessStudent(session, studentId) {
  if (!session) return false;
  if (session.role === 'ADMIN') return true;
  const student = await StudentProfile.findById(studentId).select('school department user').lean();
  if (!student) return false;
  if (session.role === 'DEAN') return String(student.school) === String(session.school);
  if (session.role === 'HOD') return String(student.department) === String(session.department);
  if (session.role === 'MENTOR') {
    const m = await Mapping.findOne({ mentor: session.sub, student: studentId, active: true }).lean();
    return !!m;
  }
  if (session.role === 'STUDENT') return String(student.user) === String(session.sub);
  return false;
}

/** Only ADMIN/DEAN/HOD may set requirements/plans/baskets. */
export function canManageAcademics(session) {
  return session && ['ADMIN', 'DEAN', 'HOD'].includes(session.role);
}

/**
 * Build a {student: {$in:[...]}} filter (or department/school filter) that limits
 * a query to the students this session may see. Returns null if unrestricted (ADMIN).
 */
export async function studentIdsInScope(session) {
  if (session.role === 'ADMIN') return null;
  if (session.role === 'MENTOR') {
    const maps = await Mapping.find({ mentor: session.sub, active: true }).select('student').lean();
    return maps.map((m) => String(m.student));
  }
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'STUDENT') filter.user = session.sub;
  const rows = await StudentProfile.find(filter).select('_id').lean();
  return rows.map((r) => String(r._id));
}
