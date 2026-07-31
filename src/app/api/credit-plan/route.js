import dbConnect from '@/lib/db';
import CreditPlan from '@/models/CreditPlan';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { studentIdsInScope } from '@/lib/access';

/** List credit plans in the caller's scope (for HoD plan-status badges). */
export async function GET() {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();

  const filter = {};
  const ids = await studentIdsInScope(session);
  if (ids) filter.student = { $in: ids };

  const plans = await CreditPlan.find(filter).select('student totalRequired updatedAt').lean();
  return json({
    plans,
    studentIdsWithPlan: plans.map((p) => String(p.student)),
  });
}
