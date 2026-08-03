import mongoose from 'mongoose';

/**
 * StudentProfile — the master academic record for a mentee.
 * Designed so that printed reports map directly to:
 *  - NAAC   : Criterion 2 (mentoring, ratio 2.3.3), Criterion 5 (progression, placement,
 *             higher studies, scholarships, participation/activities)
 *  - NIRF   : Graduation Outcomes (placement %, higher-studies %, median salary,
 *             on-time graduation / backlogs)
 *  - NBA    : Outcome-Based Education (CGPA, PO/CO attainment, at-risk tracking)
 */

const SemesterResultSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true }, // 1..N
    academicYear: String, // e.g. "2024-25"
    sgpa: Number,
    cgpa: Number,
    creditsRegistered: Number,
    creditsEarned: Number,
    backlogs: { type: Number, default: 0 },
    attendancePercent: Number,
    resultStatus: { type: String, enum: ['PASS', 'FAIL', 'PENDING', 'DETAINED'], default: 'PENDING' },
    remarks: String,
  },
  { _id: false }
);

const PlacementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PLACEMENT', 'INTERNSHIP', 'HIGHER_STUDIES', 'ENTREPRENEURSHIP'], default: 'PLACEMENT' },
    company: String,
    role: String,
    ctcLPA: Number,            // annual package in Lakhs Per Annum (feeds NIRF median salary)
    stipendPerMonth: Number,   // for internships
    offerDate: Date,
    location: String,
    // Higher studies specifics
    institution: String,       // for HIGHER_STUDIES
    programme: String,
    exam: String,              // GATE / GRE / CAT etc.
    status: { type: String, enum: ['OFFERED', 'ACCEPTED', 'JOINED', 'DECLINED'], default: 'OFFERED' },
    offerLetterUrl: String,
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const ActivitySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['CO_CURRICULAR', 'EXTRA_CURRICULAR', 'CERTIFICATION', 'PROJECT', 'PUBLICATION', 'SPORTS', 'NCC_NSS', 'HACKATHON', 'AWARD', 'OTHER'],
      default: 'OTHER',
    },
    title: String,
    organisation: String,
    date: Date,
    level: { type: String, enum: ['INSTITUTE', 'STATE', 'NATIONAL', 'INTERNATIONAL'], default: 'INSTITUTE' },
    position: String,          // Winner / Runner-up / Participation
    description: String,
    proofUrl: String,
  },
  { _id: false }
);

const ScholarshipSchema = new mongoose.Schema(
  {
    name: String,
    provider: { type: String, enum: ['GOVERNMENT', 'INSTITUTE', 'PRIVATE', 'INDUSTRY', 'PHILANTHROPIST'], default: 'GOVERNMENT' },
    amount: Number,
    academicYear: String,
    remarks: String,
  },
  { _id: false }
);

// NBA — Outcome-Based Education attainment record.
const AttainmentSchema = new mongoose.Schema(
  {
    academicYear: String,
    course: String,          // course code
    coAttainment: Number,    // 0-3 attainment level for Course Outcomes
    poAttainment: Number,    // 0-3 attainment level for Program Outcomes
    remarks: String,
  },
  { _id: false }
);

const StudentProfileSchema = new mongoose.Schema(
  {
    // Link to login account (a STUDENT User). Optional until credentials issued.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // Identity
    registrationNo: { type: String, required: true, unique: true, trim: true, index: true },
    rollNo: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    dob: Date,
    category: { type: String, enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'OTHER'] }, // NIRF OI / inclusivity
    bloodGroup: String,
    aadhaarMasked: String,
    photoUrl: String,

    // Domicile (NIRF Outreach & Inclusivity — region diversity)
    domicileState: String,
    isDifferentlyAbled: { type: Boolean, default: false },

    // Academic placement in the org tree
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    programme: String,       // "B.Tech CSE"
    batch: String,           // "2022-2026"
    admissionYear: Number,
    currentSemester: Number,
    section: String,
    admissionMode: { type: String, enum: ['REGULAR', 'LATERAL', 'MANAGEMENT', 'OTHER'], default: 'REGULAR' },

    // Prior academics
    tenthPercent: Number,
    twelfthPercent: Number,
    entranceExam: String,
    entranceRank: String,

    // Family / parent (used for monthly parent meetings)
    fatherName: String,
    motherName: String,
    guardianName: String,
    parentPhone: String,
    parentEmail: String,
    address: String,

    // Rich academic + outcome records
    semesterResults: [SemesterResultSchema],
    latestCGPA: Number,
    totalBacklogs: { type: Number, default: 0 },
    liveBacklogs: { type: Number, default: 0 },
    onTimeGraduation: { type: Boolean, default: true }, // NIRF GUE

    placements: [PlacementSchema],
    activities: [ActivitySchema],
    scholarships: [ScholarshipSchema],
    attainments: [AttainmentSchema],

    // Mentoring status
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' }, // at-risk flag (NBA)

    // Slow / advanced learner classification (NAAC 2.2.1)
    learnerCategory: { type: String, enum: ['ADVANCED', 'AVERAGE', 'SLOW', 'UNSET'], default: 'UNSET', index: true },
    learnerBasis: { type: [String], default: [] },
    learnerScore: { type: Number },
    learnerComputedAt: { type: Date },
    learnerOverride: {
      category: { type: String, enum: ['ADVANCED', 'AVERAGE', 'SLOW'] },
      reason: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      byName: String,
      at: Date,
    },
    status: { type: String, enum: ['ACTIVE', 'GRADUATED', 'DROPPED', 'DETAINED', 'ON_LEAVE'], default: 'ACTIVE' },

    updatedByMentorAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

StudentProfileSchema.index({ department: 1, batch: 1 });

export default mongoose.models.StudentProfile ||
  mongoose.model('StudentProfile', StudentProfileSchema);
