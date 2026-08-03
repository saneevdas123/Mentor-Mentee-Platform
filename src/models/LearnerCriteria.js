import mongoose from 'mongoose';

/**
 * Institution-defined criteria for classifying slow / advanced learners.
 * One document per department. This stored configuration IS the documented
 * "methodology and criteria" NAAC metric 2.2.1 asks institutions to supply.
 */
const LearnerCriteriaSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, unique: true, index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

    // 'ABSOLUTE' = fixed cut-offs, 'PERCENTILE' = relative to cohort, 'HYBRID' = either condition
    mode: { type: String, enum: ['ABSOLUTE', 'PERCENTILE', 'HYBRID'], default: 'HYBRID' },

    // Absolute cut-offs
    cgpaSlowBelow: { type: Number, default: 6.0 },
    cgpaAdvancedAtLeast: { type: Number, default: 8.0 },
    attendanceMin: { type: Number, default: 75 }, // below this contributes to "slow"
    considerBacklogs: { type: Boolean, default: true }, // any live backlog => slow signal
    considerAttendance: { type: Boolean, default: true },
    considerAttainment: { type: Boolean, default: true }, // NBA CO/PO attainment (0-3)
    attainmentSlowBelow: { type: Number, default: 1.5 },

    // Percentile cut-offs (share of cohort by CGPA)
    slowPercentile: { type: Number, default: 25 },     // bottom X%
    advancedPercentile: { type: Number, default: 80 }, // top (100-X)%

    // The written policy shown to accreditors
    policyNote: {
      type: String,
      default:
        'Learning levels are assessed each term from CGPA, live backlogs, attendance and CO/PO attainment. ' +
        'Slow learners receive remedial/bridge support, peer mentoring and additional counselling; advanced ' +
        'learners are offered enrichment (projects, certifications, competitions and peer-mentoring roles).',
    },
    ratifiedBy: { type: String, default: '' }, // e.g. "Academic Council, 12 Jun 2026"

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.LearnerCriteria || mongoose.model('LearnerCriteria', LearnerCriteriaSchema);
