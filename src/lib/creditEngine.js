/**
 * creditEngine — compares a student's CreditPlan (basket-wise requirements) against
 * the credits parsed from their gradesheets, and produces the Credit Tracker view:
 * per-basket earned / remaining, overall completion, a time-to-completion projection,
 * and a prioritised list of what to take next (feeds credit counselling).
 *
 * Pure functions — pass in plain objects.
 */

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const idStr = (v) => (v == null ? '' : String(v));

/**
 * Collapse all gradesheet lines to one row per course code (handles re-attempts):
 * a later PASS supersedes an earlier FAIL; among passes keep the higher credit.
 */
function dedupeCourses(gradesheets = []) {
  const byCourse = new Map();
  for (const gs of gradesheets) {
    for (const l of gs.parsedLines || []) {
      const key = norm(l.courseCode) || norm(l.courseTitle);
      if (!key) continue;
      const prev = byCourse.get(key);
      const cur = {
        courseCode: l.courseCode,
        courseTitle: l.courseTitle,
        credit: Number(l.credit) || 0,
        grade: l.grade,
        passed: !!l.passed,
        basketId: idStr(l.basketId || l.basket),
        basketName: l.basketName,
      };
      if (!prev) byCourse.set(key, cur);
      else if (cur.passed && !prev.passed) byCourse.set(key, cur);
      else if (cur.passed && prev.passed && cur.credit > prev.credit) byCourse.set(key, cur);
    }
  }
  return [...byCourse.values()];
}

/**
 * computeProgress({ plan, gradesheets, baskets, currentSemester }) -> report object
 *
 * Only pass gradesheets that should count (typically VERIFIED). Caller decides.
 */
export function computeProgress({ plan, gradesheets = [], baskets = [], currentSemester = null }) {
  const courses = dedupeCourses(gradesheets);
  const basketById = new Map((baskets || []).map((b) => [idStr(b._id), b]));

  // Earned credits per basket (only passing grades count).
  // A course with basketId counts only toward that id.
  // A course with only basketName counts toward the name bucket (fallback).
  const earnedByBasketId = new Map();
  const earnedByBasketName = new Map();
  let earnedTotal = 0;
  const unassigned = [];
  for (const c of courses) {
    if (!c.passed) continue;
    earnedTotal += c.credit;
    if (c.basketId) {
      earnedByBasketId.set(c.basketId, (earnedByBasketId.get(c.basketId) || 0) + c.credit);
    } else if (c.basketName) {
      earnedByBasketName.set(norm(c.basketName), (earnedByBasketName.get(norm(c.basketName)) || 0) + c.credit);
    } else {
      unassigned.push(c);
    }
  }

  const planLines = (plan?.lines || []).map((line) => {
    const bid = idStr(line.basket);
    const basket = bid ? basketById.get(bid) : null;
    const nameKey = norm(line.basketName || basket?.name);
    // Prefer id match; also include name-only mapped courses for the same basket.
    // Courses with a basketId are never also in the name map, so no double-count.
    const earned = (bid ? (earnedByBasketId.get(bid) || 0) : 0) + (nameKey ? (earnedByBasketName.get(nameKey) || 0) : 0);
    const required = Number(line.requiredCredits) || 0;
    const remaining = Math.max(0, required - earned);
    const pct = required ? Math.min(100, Math.round((earned / required) * 100)) : 100;
    return {
      basket: bid || null,
      basketName: line.basketName || basket?.name || 'Basket',
      required,
      earned,
      remaining,
      pct,
      status: remaining === 0 ? 'COMPLETE' : earned > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    };
  });

  const totalRequired = Number(plan?.totalRequired) || planLines.reduce((a, l) => a + l.required, 0);
  // Basket-wise remaining is the source of truth for CBCS counselling.
  const totalRemaining = planLines.reduce((a, l) => a + l.remaining, 0);
  const assignedEarned = planLines.reduce((a, l) => a + l.earned, 0);
  const overallPct = totalRequired ? Math.min(100, Math.round((assignedEarned / totalRequired) * 100)) : 0;

  const perSem = Number(plan?.creditsPerSemester) || 20;
  const semestersLeft = perSem ? Math.ceil(totalRemaining / perSem) : null;
  const expectedSemesters = Number(plan?.expectedSemesters) || 8;
  const semDone = currentSemester != null ? currentSemester : null;
  let onTrack = null;
  if (semDone != null && semestersLeft != null) {
    onTrack = semDone + semestersLeft <= expectedSemesters;
  }

  const recommendations = planLines
    .filter((l) => l.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .map((l) => ({
      basket: l.basket,
      basketName: l.basketName,
      creditsToTake: l.remaining,
      note: `Still need ${l.remaining} credit(s) in ${l.basketName} to stay on the CBCS plan.`,
      priority: l.remaining >= perSem ? 'HIGH' : l.remaining >= perSem / 2 ? 'MEDIUM' : 'LOW',
    }));

  return {
    totalRequired,
    earnedTotal: assignedEarned,
    passedCreditsAll: earnedTotal,
    totalRemaining,
    overallPct,
    perSem,
    semestersLeft,
    expectedSemesters,
    currentSemester: semDone,
    onTrack,
    lines: planLines,
    unassignedCredits: unassigned.reduce((a, c) => a + c.credit, 0),
    unassignedCourses: unassigned,
    recommendations,
    courseCount: courses.length,
    hasPlan: !!(plan && plan.lines && plan.lines.length),
  };
}

export default computeProgress;
