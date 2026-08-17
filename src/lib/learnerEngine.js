/**
 * Transparent, auditable learner classification.
 * Every decision returns the exact reasons (`basis`) that produced it, so the
 * result is defensible to a NAAC/NBA peer team rather than a black box.
 */

export function defaultCriteria() {
  return {
    mode: 'HYBRID',
    cgpaSlowBelow: 6.0,
    cgpaAdvancedAtLeast: 8.0,
    attendanceMin: 75,
    considerBacklogs: true,
    considerAttendance: true,
    considerAttainment: true,
    attainmentSlowBelow: 1.5,
    slowPercentile: 25,
    advancedPercentile: 80,
  };
}

function avgAttainment(student) {
  const a = student.attainments || [];
  if (!a.length) return null;
  const vals = a.map((x) => {
    if (typeof x.coAttainment === 'number') return x.coAttainment;
    if (typeof x.poAttainment === 'number') return x.poAttainment;
    if (typeof x.attained === 'number') return x.attained;
    if (typeof x.level === 'number') return x.level;
    return null;
  }).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/**
 * Build cohort percentile ranks by CGPA (0-100; higher = better).
 * Returns a Map of studentId -> percentile.
 */
export function cohortPercentiles(students) {
  const withCgpa = students.filter((s) => typeof s.latestCGPA === 'number');
  const sorted = [...withCgpa].sort((a, b) => a.latestCGPA - b.latestCGPA);
  const n = sorted.length;
  const map = new Map();
  sorted.forEach((s, i) => {
    // percentile = share of cohort at or below this CGPA
    map.set(String(s._id), n <= 1 ? 100 : Math.round(((i + 1) / n) * 100));
  });
  return map;
}

/**
 * Classify one student.
 * @returns { category: 'ADVANCED'|'AVERAGE'|'SLOW', basis: string[], score }
 */
export function classifyStudent(student, criteriaInput, percentile) {
  const c = { ...defaultCriteria(), ...(criteriaInput || {}) };
  const basis = [];
  const slowSignals = [];
  const advSignals = [];

  const cgpa = typeof student.latestCGPA === 'number' ? student.latestCGPA : null;
  const backlogs = student.liveBacklogs || 0;
  const att = typeof student.attendancePercent === 'number' ? student.attendancePercent : null;
  const attain = avgAttainment(student);
  const usePct = c.mode === 'PERCENTILE' || c.mode === 'HYBRID';
  const useAbs = c.mode === 'ABSOLUTE' || c.mode === 'HYBRID';

  // ---- slow signals ----
  if (useAbs && cgpa != null && cgpa < c.cgpaSlowBelow) slowSignals.push(`CGPA ${cgpa.toFixed(2)} is below ${c.cgpaSlowBelow}`);
  if (c.considerBacklogs && backlogs > 0) slowSignals.push(`${backlogs} live backlog${backlogs > 1 ? 's' : ''}`);
  if (c.considerAttendance && att != null && att < c.attendanceMin) slowSignals.push(`Attendance ${att}% is below ${c.attendanceMin}%`);
  if (c.considerAttainment && attain != null && attain < c.attainmentSlowBelow) slowSignals.push(`Avg CO/PO attainment ${attain.toFixed(1)} is below ${c.attainmentSlowBelow}`);
  if (usePct && percentile != null && percentile <= c.slowPercentile) slowSignals.push(`In the bottom ${c.slowPercentile}% of the cohort`);

  // ---- advanced signals ----
  if (useAbs && cgpa != null && cgpa >= c.cgpaAdvancedAtLeast) advSignals.push(`CGPA ${cgpa.toFixed(2)} is at least ${c.cgpaAdvancedAtLeast}`);
  if (usePct && percentile != null && percentile >= c.advancedPercentile) advSignals.push(`In the top ${100 - c.advancedPercentile}% of the cohort`);

  let category = 'AVERAGE';
  if (slowSignals.length) {
    category = 'SLOW';
    basis.push(...slowSignals);
  } else if (advSignals.length && backlogs === 0) {
    category = 'ADVANCED';
    basis.push(...advSignals);
  } else {
    basis.push(cgpa != null ? `CGPA ${cgpa.toFixed(2)} within the average band` : 'Insufficient data — treated as average');
  }

  // simple 0-100 score for sorting (higher = stronger student)
  let score = cgpa != null ? cgpa * 10 : 50;
  if (backlogs) score -= backlogs * 5;
  if (att != null) score += (att - 75) / 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { category, basis, score };
}

export const CATEGORY_LABELS = { ADVANCED: 'Advanced learner', AVERAGE: 'Average learner', SLOW: 'Slow learner', UNSET: 'Not assessed' };

/** Suggested interventions per category (NAAC 2.2.1 / NBA evidence). */
export function suggestedActions(category) {
  if (category === 'SLOW') return ['Remedial / bridge classes', 'Peer mentoring by an advanced learner', 'Additional counselling sessions', 'Extra assignments with feedback'];
  if (category === 'ADVANCED') return ['Enrichment projects / research', 'Certifications & MOOCs', 'Coding / technical competitions', 'Mentor junior students'];
  return ['Continue regular mentoring', 'Monitor next assessment'];
}
