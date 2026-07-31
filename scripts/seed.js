/**
 * Bootstrap script.
 *   node scripts/seed.js           -> creates the first ADMIN only
 *   node scripts/seed.js --demo    -> also creates demo school/dept + all role logins
 *
 * Uses the same models as the app. Run after setting .env / .env.local.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error('MONGODB_URI missing in .env / .env.local'); process.exit(1); }

const DEMO_PASSWORD = 'Cutm@1234';

// Minimal inline schemas (mirror /src/models) so the script has no build step.
const s = mongoose.Schema;
const User = mongoose.model('User', new s({
  name: String, email: { type: String, unique: true }, passwordHash: String, role: String,
  employeeId: String, designation: String, school: s.Types.ObjectId, department: s.Types.ObjectId,
  isActive: { type: Boolean, default: true }, mustChangePassword: { type: Boolean, default: true }, createdBy: s.Types.ObjectId,
}, { timestamps: true }));
const School = mongoose.model('School', new s({ name: String, code: { type: String, unique: true }, campus: String, dean: s.Types.ObjectId, isActive: { type: Boolean, default: true } }, { timestamps: true }));
const Department = mongoose.model('Department', new s({ name: String, code: String, school: s.Types.ObjectId, hod: s.Types.ObjectId, programmes: Array, isActive: { type: Boolean, default: true } }, { timestamps: true }));
const StudentProfile = mongoose.model('StudentProfile', new s({
  registrationNo: { type: String, unique: true }, name: String, email: String, user: s.Types.ObjectId,
  programme: String, batch: String, currentSemester: Number, latestCGPA: Number, liveBacklogs: Number,
  riskLevel: String, school: s.Types.ObjectId, department: s.Types.ObjectId, parentEmail: String,
  placements: Array, activities: Array,
}, { timestamps: true }));
const Mapping = mongoose.model('Mapping', new s({ mentor: s.Types.ObjectId, student: s.Types.ObjectId, department: s.Types.ObjectId, school: s.Types.ObjectId, academicYear: String, active: { type: Boolean, default: true } }, { timestamps: true }));

async function upsertUser({ name, email, role, password, extra = {} }) {
  const passwordHash = await bcrypt.hash(password, 10);
  let u = await User.findOne({ email: email.toLowerCase() });
  if (!u) {
    u = await User.create({
      name, email: email.toLowerCase(), role, passwordHash,
      mustChangePassword: true, isActive: true, ...extra,
    });
    console.log(`✔ ${role} created: ${email}`);
  } else {
    u.name = name;
    u.role = role;
    u.passwordHash = passwordHash;
    u.mustChangePassword = true;
    u.isActive = true;
    Object.assign(u, extra);
    await u.save();
    console.log(`• ${role} reset: ${email}`);
  }
  return u;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@cutm.ac.in').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeThisAdmin@123';
  const admin = await upsertUser({
    name: process.env.SEED_ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    role: 'ADMIN',
    password: adminPassword,
  });

  const creds = [
    { role: 'ADMIN', name: admin.name, email: adminEmail, password: adminPassword },
  ];

  if (process.argv.includes('--demo')) {
    const school = await School.findOneAndUpdate(
      { code: 'SOET' },
      { name: 'School of Engineering & Technology', code: 'SOET', campus: 'Bhubaneswar', createdBy: admin._id },
      { upsert: true, new: true }
    );
    const dept = await Department.findOneAndUpdate(
      { school: school._id, code: 'CSE' },
      { name: 'Computer Science & Engineering', code: 'CSE', school: school._id, programmes: [{ name: 'B.Tech CSE', level: 'UG', durationYears: 4, intake: 120 }] },
      { upsert: true, new: true }
    );

    const dean = await upsertUser({
      name: 'Dr. A. Dean', email: 'dean.soet@cutm.ac.in', role: 'DEAN', password: DEMO_PASSWORD,
      extra: { school: school._id, department: undefined },
    });
    await School.findByIdAndUpdate(school._id, { dean: dean._id });

    const hod = await upsertUser({
      name: 'Dr. B. Hod', email: 'hod.cse@cutm.ac.in', role: 'HOD', password: DEMO_PASSWORD,
      extra: { school: school._id, department: dept._id },
    });
    await Department.findByIdAndUpdate(dept._id, { hod: hod._id });

    const mentor = await upsertUser({
      name: 'Prof. C. Mentor', email: 'mentor.cse@cutm.ac.in', role: 'MENTOR', password: DEMO_PASSWORD,
      extra: { school: school._id, department: dept._id, employeeId: 'CSE-101' },
    });

    creds.push(
      { role: 'DEAN', name: dean.name, email: 'dean.soet@cutm.ac.in', password: DEMO_PASSWORD },
      { role: 'HOD', name: hod.name, email: 'hod.cse@cutm.ac.in', password: DEMO_PASSWORD },
      { role: 'MENTOR', name: mentor.name, email: 'mentor.cse@cutm.ac.in', password: DEMO_PASSWORD },
    );

    const demoStudents = [
      { registrationNo: '2201CSE001', name: 'Aarav Sahoo', email: 'aarav@cutm.ac.in', latestCGPA: 8.4, liveBacklogs: 0, riskLevel: 'LOW', parentEmail: 'parent.aarav@example.com', placements: [{ type: 'PLACEMENT', company: 'TCS', ctcLPA: 4.5, status: 'ACCEPTED' }] },
      { registrationNo: '2201CSE002', name: 'Diya Patra', email: 'diya@cutm.ac.in', latestCGPA: 6.1, liveBacklogs: 2, riskLevel: 'HIGH', parentEmail: 'parent.diya@example.com', placements: [] },
      { registrationNo: '2201CSE003', name: 'Ishaan Rout', email: 'ishaan@cutm.ac.in', latestCGPA: 9.1, liveBacklogs: 0, riskLevel: 'LOW', parentEmail: 'parent.ishaan@example.com', placements: [{ type: 'HIGHER_STUDIES', institution: 'IIT', programme: 'M.Tech', status: 'ACCEPTED' }] },
    ];

    for (const d of demoStudents) {
      const studentUser = await upsertUser({
        name: d.name, email: d.email, role: 'STUDENT', password: DEMO_PASSWORD,
        extra: { school: school._id, department: dept._id },
      });
      const sp = await StudentProfile.findOneAndUpdate(
        { registrationNo: d.registrationNo },
        {
          ...d,
          user: studentUser._id,
          programme: 'B.Tech CSE',
          batch: '2022-2026',
          currentSemester: 6,
          school: school._id,
          department: dept._id,
        },
        { upsert: true, new: true }
      );
      await Mapping.findOneAndUpdate(
        { mentor: mentor._id, student: sp._id, academicYear: '2022-2026' },
        { mentor: mentor._id, student: sp._id, department: dept._id, school: school._id, academicYear: '2022-2026', active: true },
        { upsert: true }
      );
      creds.push({ role: 'STUDENT', name: d.name, email: d.email, password: DEMO_PASSWORD });
    }

    console.log('✔ Demo school/dept/mappings ready (SOET / CSE).');
  }

  console.log('\n========== SHAREABLE LOGIN CREDENTIALS ==========');
  console.log('App URL:', process.env.APP_URL || 'http://localhost:3000');
  console.log('Login path: /login');
  console.log('(First login asks to set a new password — use the temp password below once.)\n');
  for (const c of creds) {
    console.log(`${c.role.padEnd(8)}  ${c.email.padEnd(28)}  ${c.password}  (${c.name})`);
  }
  console.log('=================================================\n');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
