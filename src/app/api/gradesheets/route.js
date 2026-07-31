import dbConnect from '@/lib/db';
import Gradesheet from '@/models/Gradesheet';
import Basket from '@/models/Basket';
import CourseMap from '@/models/CourseMap';
import Counselling from '@/models/Counselling';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent, studentIdsInScope } from '@/lib/access';
import { parseGradesheet } from '@/lib/gradesheetParser';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const filter = {};
  if (studentId) {
    if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
    filter.student = studentId;
  } else {
    const ids = await studentIdsInScope(session);
    if (ids) filter.student = { $in: ids };
  }
  const gradesheets = await Gradesheet.find(filter)
    .select('-fileData')
    .populate('student', 'name registrationNo')
    .sort({ createdAt: -1 })
    .lean();
  return json({ gradesheets });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();

  const form = await req.formData();
  const file = form.get('file');
  const studentId = form.get('studentId');
  if (!studentId) return error('studentId is required.');
  if (!file || typeof file === 'string') return error('A PDF file is required.');
  if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) return error('File too large (max 10 MB).', 413);
  const isPdf = (file.type || '').includes('pdf') || (file.name || '').toLowerCase().endsWith('.pdf');
  if (!isPdf) return error('Please upload a PDF gradesheet.');

  const student = await StudentProfile.findById(studentId).select('department school currentSemester').lean();
  const baskets = await Basket.find({ department: student.department, isActive: true }).lean();

  let parsed;
  try {
    parsed = await parseGradesheet(buf, baskets);
  } catch (e) {
    return error('Could not read this PDF. If it is a scanned image, please upload a text-based PDF. (' + e.message + ')', 422);
  }

  // Fill unmapped rows from the department CourseMap memory.
  const unmappedCodes = parsed.lines.filter((l) => !l.basketId).map((l) => l.courseCode);
  if (unmappedCodes.length) {
    const maps = await CourseMap.find({ department: student.department, courseCode: { $in: unmappedCodes } }).lean();
    const byCode = Object.fromEntries(maps.map((m) => [m.courseCode, m]));
    for (const l of parsed.lines) {
      if (!l.basketId && byCode[l.courseCode]) {
        l.basketId = byCode[l.courseCode].basket;
        l.basketName = byCode[l.courseCode].basketName;
      }
    }
  }

  const parsedLines = parsed.lines.map((l) => ({
    courseCode: l.courseCode,
    courseTitle: l.courseTitle,
    credit: l.credit,
    grade: l.grade,
    passed: l.passed,
    basket: l.basketId || undefined,
    basketName: l.basketName || undefined,
  }));
  const creditsEarnedTotal = parsedLines.filter((l) => l.passed).reduce((a, l) => a + (l.credit || 0), 0);
  const stillUnmapped = parsedLines.filter((l) => !l.basket).length;

  const semester = Number(form.get('semester')) || parsed.meta.semester || student.currentSemester;
  const gs = await Gradesheet.create({
    student: studentId,
    department: student.department,
    school: student.school,
    semester,
    academicYear: form.get('academicYear') || parsed.meta.academicYear,
    title: form.get('title') || (semester ? `Semester ${semester} gradesheet` : 'Gradesheet'),
    fileName: file.name,
    mimeType: file.type || 'application/pdf',
    fileSize: buf.length,
    fileData: buf,
    parsedLines,
    rawTextSnippet: parsed.rawTextSnippet,
    detectedSGPA: parsed.meta.sgpa,
    creditsEarnedTotal,
    status: stillUnmapped ? 'NEEDS_REVIEW' : 'PARSED',
    parseWarning: parsed.warning,
    uploadedBy: session.sub,
  });

  // If this fulfils a mentor's gradesheet request, close it.
  const requestId = form.get('requestId');
  if (requestId) {
    await Counselling.findByIdAndUpdate(requestId, {
      requestStatus: 'FULFILLED',
      relatedGradesheet: gs._id,
    });
    gs.requestRef = requestId;
    await gs.save();
  }

  const obj = gs.toObject();
  delete obj.fileData;
  return json({ ok: true, gradesheet: obj, warning: parsed.warning, unmapped: stillUnmapped }, 201);
}
