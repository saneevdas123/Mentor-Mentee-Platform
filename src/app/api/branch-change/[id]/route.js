import dbConnect from '@/lib/db';
import BranchChangeRequest from '@/models/BranchChangeRequest';
import Counselling from '@/models/Counselling';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const reqDoc = await BranchChangeRequest.findById(params.id);
  if (!reqDoc) return error('Request not found', 404);
  if (!(await canAccessStudent(session, reqDoc.student))) return error('Forbidden', 403);
  const b = await req.json();

  // Student may only withdraw their own request.
  if (session.role === 'STUDENT') {
    if (b.action === 'withdraw') {
      reqDoc.status = 'WITHDRAWN';
      await reqDoc.save();
      return json({ ok: true, request: reqDoc });
    }
    return error('Forbidden', 403);
  }

  // Mentor counselling step.
  if (b.action === 'counsel') {
    reqDoc.mentorCounselledOn = new Date();
    reqDoc.mentorRemarks = b.mentorRemarks;
    reqDoc.mentorRecommends = !!b.mentorRecommends;
    reqDoc.status = b.mentorRecommends ? 'RECOMMENDED' : 'NOT_RECOMMENDED';
    if (session.role === 'MENTOR') reqDoc.mentor = session.sub;
    await reqDoc.save();
    // Log the interaction so it appears in the counselling/interaction report.
    await Counselling.create({
      student: reqDoc.student,
      mentor: reqDoc.mentor,
      department: reqDoc.department,
      school: reqDoc.school,
      kind: 'BRANCH_CHANGE',
      subject: `Branch change counselling: ${reqDoc.currentProgramme || '—'} → ${reqDoc.requestedProgramme}`,
      summary: b.mentorRemarks,
      advice: b.mentorRecommends ? 'Mentor recommends the branch change.' : 'Mentor does not recommend the branch change.',
      relatedBranchChange: reqDoc._id,
      occurredOn: new Date(),
      createdBy: session.sub,
      createdByRole: session.role,
    });
    return json({ ok: true, request: reqDoc });
  }

  // HoD / Dean / Admin final decision.
  if (b.action === 'decide') {
    if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Only HoD/Dean can decide.', 403);
    reqDoc.status = b.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    reqDoc.decisionRemarks = b.decisionRemarks;
    reqDoc.decidedBy = session.sub;
    reqDoc.decidedByRole = session.role;
    reqDoc.decisionOn = new Date();
    await reqDoc.save();
    return json({ ok: true, request: reqDoc });
  }

  return error('Unknown action.');
}
