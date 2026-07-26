/**
 * Bootstrap script.
 *   node scripts/seed.js           -> creates the first ADMIN only
 *   node scripts/seed.js --demo    -> also creates a demo school/dept/mentor/students
 *
 * Uses the same models as the app. Run after setting .env.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error('MONGODB_URI missing in .env'); process.exit(1); }

// Minimal inline schemas (mirror /src/models) so the script has no build step.
const s = mongoose.Schema;
const User = mongoose.model('User', new s({
  name: String, email: { type: String, unique: true }, passwordHash: String, role: String,
  employeeId: String, designation: String, school: s.Types.ObjectId, department: s.Types.ObjectId,
  isActive: { type: Boolean, default: true }, mustChangePassword: { type: Boolean, default: true }, createdBy: s.Types.ObjectId,
}, { timestamps: true }));
const School = mongoose.model('School', new s({ name: String, code: { type: String, unique: true }, campus: String, dean: s.Types.ObjectId, isActive: { type: Boolean, default: true } }, { timestamps: true }));
const Department = mongoose.model('Department', new s({ name: String, code: String, school: s.Types.ObjectId, hod: s.Types.ObjectId, programmes: Array, isActive: { type: Boolean, default: true } }, { timestamps: true }));
const StudentProfile = mongoose.model('StudentProfile', new s({ registrationNo: { type: String, unique: true }, name: String, email: String, programme: String, batch: String, currentSemester: Number, latestCGPA: Number, liveBacklogs: Number, riskLevel: String, school: s.Types.ObjectId, department: s.Types.ObjectId, parentEmail: String, placements: Array, activities: Array }, { timestamps: true }));
const Mapping = mongoose.model('Mapping', new s({ mentor: s.Types.ObjectId, student: s.Types.ObjectId, department: s.Types.ObjectId, school: s.Types.ObjectId, academicYear: String, active: { type: Boolean, default: true } }, { timestamps: true }));

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@cutm.ac.in').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'System Administrator',
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeThisAdmin@123', 10),
      role: 'ADMIN', mustChangePassword: true,
    });
    console.log(`✔ Admin created: ${adminEmail}`);
  } else {
    console.log(`• Admin already exists: ${adminEmail}`);
  }

  if (process.argv.includes('--demo')) {
    const school = await School.findOneAndUpdate({ code: 'SOET' }, { name: 'School of Engineering & Technology', code: 'SOET', campus: 'Bhubaneswar', createdBy: admin._id }, { upsert: true, new: true });
    const dept = await Department.findOneAndUpdate({ school: school._id, code: 'CSE' }, { name: 'Computer Science & Engineering', code: 'CSE', school: school._id, programmes: [{ name: 'B.Tech CSE', level: 'UG', durationYears: 4, intake: 120 }] }, { upsert: true, new: true });

    const mk = async (name, email, role, extra = {}) => {
      let u = await User.findOne({ email });
      if (!u) u = await User.create({ name, email, role, passwordHash: await bcrypt.hash('Cutm@1234', 10), school: school._id, department: dept._id, mustChangePassword: true, ...extra });
      return u;
    };
    const dean = await mk('Dr. A. Dean', 'dean.soet@cutm.ac.in', 'DEAN', { department: undefined });
    await School.findByIdAndUpdate(school._id, { dean: dean._id });
    const hod = await mk('Dr. B. Hod', 'hod.cse@cutm.ac.in', 'HOD');
    await Department.findByIdAndUpdate(dept._id, { hod: hod._id });
    const mentor = await mk('Prof. C. Mentor', 'mentor.cse@cutm.ac.in', 'MENTOR', { employeeId: 'CSE-101' });

    const demoStudents = [
      { registrationNo: '2201CSE001', name: 'Aarav Sahoo', email: 'aarav@cutm.ac.in', latestCGPA: 8.4, liveBacklogs: 0, riskLevel: 'LOW', parentEmail: 'parent.aarav@example.com', placements: [{ type: 'PLACEMENT', company: 'TCS', ctcLPA: 4.5, status: 'ACCEPTED' }] },
      { registrationNo: '2201CSE002', name: 'Diya Patra', email: 'diya@cutm.ac.in', latestCGPA: 6.1, liveBacklogs: 2, riskLevel: 'HIGH', parentEmail: 'parent.diya@example.com', placements: [] },
      { registrationNo: '2201CSE003', name: 'Ishaan Rout', email: 'ishaan@cutm.ac.in', latestCGPA: 9.1, liveBacklogs: 0, riskLevel: 'LOW', parentEmail: 'parent.ishaan@example.com', placements: [{ type: 'HIGHER_STUDIES', institution: 'IIT', programme: 'M.Tech', status: 'ACCEPTED' }] },
    ];
    for (const d of demoStudents) {
      const sp = await StudentProfile.findOneAndUpdate({ registrationNo: d.registrationNo }, { ...d, programme: 'B.Tech CSE', batch: '2022-2026', currentSemester: 6, school: school._id, department: dept._id }, { upsert: true, new: true });
      await Mapping.findOneAndUpdate({ mentor: mentor._id, student: sp._id, academicYear: '2022-2026' }, { mentor: mentor._id, student: sp._id, department: dept._id, school: school._id, academicYear: '2022-2026', active: true }, { upsert: true });
    }
    console.log('✔ Demo data created. Logins (password: Cutm@1234): dean.soet@, hod.cse@, mentor.cse@cutm.ac.in');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
