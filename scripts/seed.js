/**
 * Bootstrap + demo seed.
 *   npm run seed          -> creates/resets the first ADMIN only
 *   npm run seed -- --demo
 *   npm run demo          -> setup + fully populated demo
 *
 * Idempotent. Loads .env.local then .env.
 * Demo accounts are ready-to-use (mustChangePassword: false).
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('✗ MONGODB_URI missing. Put it in .env.local (or run "npm run setup").');
  process.exit(1);
}

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

async function upsertUser({ name, email, role, password, extra = {} }) {
  const passwordHash = await hash(password);
  return upsert(User, { email: email.toLowerCase() }, {
    name,
    email: email.toLowerCase(),
    role,
    passwordHash,
    isActive: true,
    mustChangePassword: false,
    ...extra,
  });
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('• Connected to MongoDB');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const admin = await upsertUser({
    name: process.env.SEED_ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    role: 'ADMIN',
    password: adminPassword,
  });
  console.log(`✔ ADMIN ready: ${adminEmail}`);

  const creds = [
    { role: 'ADMIN', email: adminEmail, password: adminPassword, name: admin.name },
  ];

  if (!process.argv.includes('--demo')) {
    await mongoose.disconnect();
    console.log('\n========== CREDENTIALS ==========');
    for (const c of creds) console.log(`${c.role.padEnd(8)}  ${c.email.padEnd(28)}  ${c.password}`);
    console.log('=================================\nDone. (Add --demo for full role seed.)');
    return;
  }

  const school = await upsert(School, { code: 'SOET' }, {
    name: 'School of Engineering & Technology', code: 'SOET', campus: 'Bhubaneswar', isActive: true, createdBy: admin._id,
  });
  const dept = await upsert(Department, { school: school._id, code: 'CSE' }, {
    name: 'Computer Science & Engineering', code: 'CSE', school: school._id, isActive: true,
    programmes: [{ name: 'B.Tech CSE', level: 'UG', durationYears: 4, intake: 120 }],
  });

  const dean = await upsertUser({
    name: 'Dr. A. Dean', email: 'dean.soet@cutm.ac.in', role: 'DEAN', password: DEMO_PW,
    extra: { school: school._id },
  });
  await School.findByIdAndUpdate(school._id, { $set: { dean: dean._id } });

  const hod = await upsertUser({
    name: 'Dr. B. Hod', email: 'hod.cse@cutm.ac.in', role: 'HOD', password: DEMO_PW,
    extra: { school: school._id, department: dept._id },
  });
  await Department.findByIdAndUpdate(dept._id, { $set: { hod: hod._id } });

  const mentor = await upsertUser({
    name: 'Prof. C. Mentor', email: 'mentor.cse@cutm.ac.in', role: 'MENTOR', password: DEMO_PW,
    extra: { school: school._id, department: dept._id, employeeId: 'CSE-101' },
  });

  creds.push(
    { role: 'DEAN', email: 'dean.soet@cutm.ac.in', password: DEMO_PW, name: dean.name },
    { role: 'HOD', email: 'hod.cse@cutm.ac.in', password: DEMO_PW, name: hod.name },
    { role: 'MENTOR', email: 'mentor.cse@cutm.ac.in', password: DEMO_PW, name: mentor.name },
  );
  console.log('✔ DEAN / HOD / MENTOR ready');

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
  console.log(`✔ CBCS baskets ready (${basketDefs.length})`);

  await upsert(LearnerCriteria, { department: dept._id }, {
    department: dept._id, school: school._id, mode: 'HYBRID',
    cgpaSlowBelow: 6.0, cgpaAdvancedAtLeast: 8.0, attendanceMin: 75,
    considerBacklogs: true, considerAttendance: true, considerAttainment: true, attainmentSlowBelow: 1.5,
    slowPercentile: 25, advancedPercentile: 80,
    ratifiedBy: 'Academic Council (demo)',
  });

  const students = [
    { registrationNo: '2201CSE001', name: 'Aarav Sahoo', email: 'aarav@cutm.ac.in', latestCGPA: 8.4, liveBacklogs: 0, attendancePercent: 88, riskLevel: 'LOW', currentSemester: 6, batch: '2022-2026', attainments: [{ code: 'CO1', attained: 2.6 }], parentEmail: 'parent.aarav@example.com', placements: [{ type: 'PLACEMENT', company: 'TCS', ctcLPA: 4.5, status: 'ACCEPTED' }] },
    { registrationNo: '2201CSE002', name: 'Diya Patra', email: 'diya@cutm.ac.in', latestCGPA: 6.1, liveBacklogs: 2, attendancePercent: 68, riskLevel: 'HIGH', currentSemester: 6, batch: '2022-2026', attainments: [{ code: 'CO1', attained: 1.2 }], parentEmail: 'parent.diya@example.com' },
    { registrationNo: '2201CSE003', name: 'Ishaan Rout', email: 'ishaan@cutm.ac.in', latestCGPA: 9.1, liveBacklogs: 0, attendancePercent: 93, riskLevel: 'LOW', currentSemester: 6, batch: '2022-2026', attainments: [{ code: 'CO1', attained: 2.9 }], parentEmail: 'parent.ishaan@example.com', placements: [{ type: 'HIGHER_STUDIES', institution: 'IIT', programme: 'M.Tech', status: 'ACCEPTED' }] },
    { registrationNo: '2501CSE014', name: 'Kiara Mohanty', email: 'kiara@cutm.ac.in', latestCGPA: 7.8, liveBacklogs: 0, attendancePercent: 90, riskLevel: 'LOW', currentSemester: 1, batch: '2025-2029', attainments: [{ code: 'CO1', attained: 2.0 }], parentEmail: 'parent.kiara@example.com' },
  ];

  const totalRequired = basketDefs.reduce((s, b) => s + b[2], 0);
  for (const d of students) {
    const studentUser = await upsertUser({
      name: d.name, email: d.email, role: 'STUDENT', password: DEMO_PW,
      extra: { school: school._id, department: dept._id },
    });
    const { currentSemester, batch, ...rest } = d;
    const sp = await upsert(StudentProfile, { registrationNo: d.registrationNo }, {
      ...rest,
      user: studentUser._id,
      programme: 'B.Tech CSE',
      batch,
      currentSemester,
      school: school._id,
      department: dept._id,
    });
    await upsert(Mapping, { mentor: mentor._id, student: sp._id, academicYear: batch }, {
      mentor: mentor._id, student: sp._id, department: dept._id, school: school._id,
      academicYear: batch, active: true, assignedBy: hod._id,
    });
    await upsert(CreditPlan, { student: sp._id }, {
      student: sp._id, department: dept._id, school: school._id, programme: 'B.Tech CSE',
      lines: Object.values(baskets).map((b) => ({ basket: b._id, basketName: b.name, requiredCredits: b.defaultCredits })),
      totalRequired, creditsPerSemester: 20, expectedSemesters: 8,
    });
    creds.push({ role: 'STUDENT', email: d.email, password: DEMO_PW, name: d.name });
  }
  console.log(`✔ STUDENTS ready (${students.length}) + mappings + credit plans`);

  const anAarav = await StudentProfile.findOne({ registrationNo: '2201CSE001' });
  await upsert(Counselling, { student: anAarav._id, subject: 'Welcome mentoring session' }, {
    student: anAarav._id, mentor: mentor._id, department: dept._id, school: school._id,
    kind: 'ACADEMIC', mode: 'IN_PERSON', subject: 'Welcome mentoring session',
    summary: 'Reviewed goals for the semester.', advice: 'Maintain attendance and start elective planning.', occurredOn: new Date(),
  });
  await upsert(Meeting, { title: 'Weekly Mentoring — Sec A', mentor: mentor._id }, {
    title: 'Weekly Mentoring — Sec A', type: 'WEEKLY_MENTORING', mentor: mentor._id,
    department: dept._id, school: school._id,
    scheduledAt: new Date(Date.now() + 3 * 864e5), durationMins: 45, status: 'SCHEDULED',
    meetLink: 'https://meet.google.com/lookup/cutm-demo', agenda: 'Credit progress review.',
  });

  await mongoose.disconnect();

  console.log('\n========== SHAREABLE LOGIN CREDENTIALS ==========');
  console.log('App URL:', process.env.APP_URL || 'http://localhost:3000');
  console.log('Login: /login  (no forced password change on demo accounts)\n');
  for (const c of creds) {
    console.log(`${c.role.padEnd(8)}  ${c.email.padEnd(28)}  ${c.password}  (${c.name})`);
  }
  console.log('=================================================\nDone.');
}

main().catch((e) => { console.error('✗ Seed failed:', e); process.exit(1); });
