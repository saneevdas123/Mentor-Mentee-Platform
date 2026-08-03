/**
 * Bootstrap + demo seed.
 *   npm run seed          -> creates the first ADMIN only
 *   npm run demo          -> setup + a fully populated demo (recommended for a PoC)
 *
 * Idempotent: safe to run repeatedly. Uses relaxed schemas (strict:false) so it can
 * never silently drop fields the app expects. Demo accounts are ready-to-use and are
 * NOT forced to change their password, so a demo login keeps working across restarts.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error('✗ MONGODB_URI missing. Run "npm run setup" and edit .env first.'); process.exit(1); }

const S = mongoose.Schema;
const opt = { timestamps: true, strict: false };
const model = (n) => mongoose.models[n] || mongoose.model(n, new S({}, opt));
const User = model('User');
const School = model('School');
const Department = model('Department');
const StudentProfile = model('StudentProfile');
const Mapping = model('Mapping');
const Basket = model('Basket');
const CreditPlan = model('CreditPlan');
const LearnerCriteria = model('LearnerCriteria');
const Counselling = model('Counselling');
const Meeting = model('Meeting');

const hash = (p) => bcrypt.hash(p, 10);
const DEMO_PW = 'Cutm@1234';

async function upsert(Model, where, doc) {
  return Model.findOneAndUpdate(where, { $set: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('• Connected to MongoDB');

  // ---- Admin bootstrap ----
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@cutm.ac.in').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'System Administrator',
      email: adminEmail, passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeThisAdmin@123'),
      role: 'ADMIN', isActive: true, mustChangePassword: true,
    });
    console.log(`✔ Admin created: ${adminEmail}`);
  } else {
    console.log(`• Admin already exists: ${adminEmail}`);
  }

  if (!process.argv.includes('--demo')) {
    await mongoose.disconnect();
    console.log('Done. (Run "npm run demo" for a fully populated demo.)');
    return;
  }

  // ---- School / Department ----
  const school = await upsert(School, { code: 'SOET' }, { name: 'School of Engineering & Technology', code: 'SOET', campus: 'Bhubaneswar', isActive: true, createdBy: admin._id });
  const dept = await upsert(Department, { school: school._id, code: 'CSE' }, {
    name: 'Computer Science & Engineering', code: 'CSE', school: school._id, isActive: true,
    programmes: [{ name: 'B.Tech CSE', level: 'UG', durationYears: 4, intake: 120 }],
  });

  // ---- People (demo accounts: ready to use, no forced password change) ----
  const mkUser = async (name, email, role, extra = {}) =>
    upsert(User, { email: email.toLowerCase() }, {
      name, email: email.toLowerCase(), role, isActive: true, mustChangePassword: false,
      passwordHash: await hash(DEMO_PW), school: school._id, ...extra,
    });

  const dean = await mkUser('Dr. A. Dean', 'dean.soet@cutm.ac.in', 'DEAN');
  await School.findByIdAndUpdate(school._id, { $set: { dean: dean._id } });
  const hod = await mkUser('Dr. B. Hod', 'hod.cse@cutm.ac.in', 'HOD', { department: dept._id });
  await Department.findByIdAndUpdate(dept._id, { $set: { hod: hod._id } });
  const mentor = await mkUser('Prof. C. Mentor', 'mentor.cse@cutm.ac.in', 'MENTOR', { department: dept._id, employeeId: 'CSE-101' });

  // ---- CBCS baskets ----
  const basketDefs = [
    ['Foundation Core', 'FC', 24, 1, ['Foundation', 'Basic Sciences']],
    ['Program Core', 'PC', 60, 2, ['Core', 'Discipline Core']],
    ['Program Elective', 'PE', 18, 3, ['Elective', 'DE']],
    ['Skill Enhancement', 'SE', 20, 4, ['Skill', 'Ability Enhancement']],
    ['Project / Internship', 'PI', 24, 5, ['Project', 'Internship']],
    ['Open Elective', 'OE', 12, 6, ['Open']],
  ];
  const baskets = {};
  for (const [name, code, cr, order, aliases] of basketDefs) {
    baskets[code] = await upsert(Basket, { department: dept._id, code }, {
      name, code, department: dept._id, school: school._id, defaultCredits: cr, order, aliases, isActive: true,
    });
  }

  // ---- Learner classification policy (NAAC 2.2.1) ----
  await upsert(LearnerCriteria, { department: dept._id }, {
    department: dept._id, school: school._id, mode: 'HYBRID',
    cgpaSlowBelow: 6.0, cgpaAdvancedAtLeast: 8.0, attendanceMin: 75,
    considerBacklogs: true, considerAttendance: true, considerAttainment: true, attainmentSlowBelow: 1.5,
    slowPercentile: 25, advancedPercentile: 80,
    ratifiedBy: 'Academic Council (demo)',
  });

  // ---- Students (mix of advanced / average / slow so the demo shows the feature) ----
  const students = [
    { registrationNo: '2201CSE001', name: 'Aarav Sahoo', email: 'aarav@cutm.ac.in', latestCGPA: 8.4, liveBacklogs: 0, attendancePercent: 88, riskLevel: 'LOW', attainments: [{ code: 'CO1', attained: 2.6 }], parentEmail: 'parent.aarav@example.com', placements: [{ type: 'PLACEMENT', company: 'TCS', ctcLPA: 4.5, status: 'ACCEPTED' }] },
    { registrationNo: '2201CSE002', name: 'Diya Patra', email: 'diya@cutm.ac.in', latestCGPA: 6.1, liveBacklogs: 2, attendancePercent: 68, riskLevel: 'HIGH', attainments: [{ code: 'CO1', attained: 1.2 }], parentEmail: 'parent.diya@example.com' },
    { registrationNo: '2201CSE003', name: 'Ishaan Rout', email: 'ishaan@cutm.ac.in', latestCGPA: 9.1, liveBacklogs: 0, attendancePercent: 93, riskLevel: 'LOW', attainments: [{ code: 'CO1', attained: 2.9 }], parentEmail: 'parent.ishaan@example.com', placements: [{ type: 'HIGHER_STUDIES', institution: 'IIT', programme: 'M.Tech', status: 'ACCEPTED' }] },
    { registrationNo: '2201CSE004', name: 'Meera Das', email: 'meera@cutm.ac.in', latestCGPA: 7.0, liveBacklogs: 0, attendancePercent: 81, riskLevel: 'LOW', attainments: [{ code: 'CO1', attained: 2.1 }], parentEmail: 'parent.meera@example.com' },
    { registrationNo: '2201CSE005', name: 'Rohit Khan', email: 'rohit@cutm.ac.in', latestCGPA: 5.4, liveBacklogs: 1, attendancePercent: 72, riskLevel: 'HIGH', attainments: [{ code: 'CO1', attained: 1.0 }], parentEmail: 'parent.rohit@example.com' },
  ];
  for (const d of students) {
    const sp = await upsert(StudentProfile, { registrationNo: d.registrationNo }, {
      ...d, programme: 'B.Tech CSE', batch: '2022-2026', currentSemester: 6, school: school._id, department: dept._id,
    });
    await upsert(Mapping, { mentor: mentor._id, student: sp._id, academicYear: '2022-2026' }, {
      mentor: mentor._id, student: sp._id, department: dept._id, school: school._id, academicYear: '2022-2026', active: true, assignedBy: hod._id,
    });
    // credit plan seeded from basket defaults
    await upsert(CreditPlan, { student: sp._id }, {
      student: sp._id, department: dept._id, school: school._id,
      lines: Object.values(baskets).map((b) => ({ basket: b._id, basketName: b.name, requiredCredits: b.defaultCredits })),
      totalRequired: basketDefs.reduce((s, b) => s + b[2], 0), creditsPerSemester: 20, expectedSemesters: 8,
    });
  }

  // ---- A counselling record + a meeting so the dashboards aren't empty ----
  const anAarav = await StudentProfile.findOne({ registrationNo: '2201CSE001' });
  await upsert(Counselling, { student: anAarav._id, subject: 'Welcome mentoring session' }, {
    student: anAarav._id, mentor: mentor._id, department: dept._id, school: school._id,
    kind: 'ACADEMIC', mode: 'IN_PERSON', subject: 'Welcome mentoring session',
    summary: 'Reviewed goals for the semester.', advice: 'Maintain attendance and start elective planning.', occurredOn: new Date(),
  });
  await upsert(Meeting, { title: 'Weekly Mentoring — Sec A', mentor: mentor._id }, {
    title: 'Weekly Mentoring — Sec A', type: 'WEEKLY_MENTORING', mentor: mentor._id, department: dept._id, school: school._id,
    scheduledAt: new Date(Date.now() + 3 * 864e5), durationMins: 45, status: 'SCHEDULED',
    meetLink: 'https://meet.google.com/lookup/cutm-demo', agenda: 'Credit progress review.',
  });

  await mongoose.disconnect();
  console.log('\n✔ Demo data ready. Sign in (password for all demo users: ' + DEMO_PW + '):');
  console.log('   Admin  : ' + adminEmail + '  (password: your SEED_ADMIN_PASSWORD)');
  console.log('   Dean   : dean.soet@cutm.ac.in');
  console.log('   HoD    : hod.cse@cutm.ac.in');
  console.log('   Mentor : mentor.cse@cutm.ac.in');
  console.log('Done.');
}

main().catch((e) => { console.error('✗ Seed failed:', e.message); process.exit(1); });
