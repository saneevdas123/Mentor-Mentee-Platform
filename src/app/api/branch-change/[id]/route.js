import dbConnect from '@/lib/db';
import BranchChangeRequest from '@/models/BranchChangeRequest';
import Counselling from '@/models/Counselling';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export async function PATCH(req, { params }) {
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
      if (!['REQUESTED', 'COUNSELLED', 'RECOMMENDED', 'NOT_RECOMMENDED'].includes(reqDoc.status)) {
        return error('This request can no longer be withdrawn.', 400);
      }
      reqDoc.status = 'WITHDRAWN';
      await reqDoc.save();
      return json({ ok: true, request: reqDoc });
    }
    return error('Forbidden', 403);
  }

  // Mentor counselling step (required before HoD/Dean decision).
  if (b.action === 'counsel') {
    if (!['REQUESTED', 'COUNSELLED'].includes(reqDoc.status)) {
      return error('This request has already been counselled or decided.', 400);
    }
    if (!b.mentorRemarks?.trim()) return error('Counselling remarks are required.');
    reqDoc.mentorCounselledOn = new Date();
    reqDoc.mentorRemarks = b.mentorRemarks;
    reqDoc.mentorRecommends = !!b.mentorRecommends;
    // COUNSELLED is the intermediate audit state; recommendation flags the outcome.
    reqDoc.status = b.mentorRecommends ? 'RECOMMENDED' : 'NOT_RECOMMENDED';
    if (session.role === 'MENTOR') reqDoc.mentor = session.sub;
    await reqDoc.save();

    await Counselling.create({
      student: reqDoc.student,
      mentor: reqDoc.mentor || session.sub,
      department: reqDoc.department,
      school: reqDoc.school,
      kind: 'BRANCH_CHANGE',
      subject: `Branch change counselling: ${reqDoc.currentProgramme || '—'} → ${reqDoc.requestedProgramme}`,
      summary: b.mentorRemarks,
      advice: b.mentorRecommends
        ? 'Mentor recommends the branch change after counselling the student on academic impact.'
        : 'Mentor does not recommend the branch change after counselling the student.',
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
    if (!['RECOMMENDED', 'NOT_RECOMMENDED', 'COUNSELLED'].includes(reqDoc.status)) {
      return error('Wait for mentor counselling before deciding.', 400);
    }
    const approved = b.decision === 'APPROVED';
    reqDoc.status = approved ? 'APPROVED' : 'REJECTED';
    reqDoc.decisionRemarks = b.decisionRemarks;
    reqDoc.decidedBy = session.sub;
    reqDoc.decidedByRole = session.role;
    reqDoc.decisionOn = new Date();
    await reqDoc.save();

    // Apply programme change on approval (CBCS / academic record).
    if (approved && reqDoc.requestedProgramme) {
      await StudentProfile.findByIdAndUpdate(reqDoc.student, {
        programme: reqDoc.requestedProgramme,
      });
    }

    await Counselling.create({
      student: reqDoc.student,
      mentor: reqDoc.mentor,
      department: reqDoc.department,
      school: reqDoc.school,
      kind: 'BRANCH_CHANGE',
      subject: `Branch change ${approved ? 'approved' : 'rejected'}: → ${reqDoc.requestedProgramme}`,
      summary: b.decisionRemarks || `Decision by ${session.role}: ${approved ? 'APPROVED' : 'REJECTED'}`,
      advice: approved
        ? `Student programme updated to ${reqDoc.requestedProgramme}.`
        : 'Student remains in the current programme.',
      relatedBranchChange: reqDoc._id,
      occurredOn: new Date(),
      createdBy: session.sub,
      createdByRole: session.role,
    });

    return json({ ok: true, request: reqDoc });
  }

  return error('Unknown action.');
}
