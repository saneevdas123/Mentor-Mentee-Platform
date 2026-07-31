import mongoose from 'mongoose';

/**
 * Counselling — the auditable record of a single mentor↔mentee interaction.
 * Every kind of touchpoint is logged here so a complete, downloadable
 * interaction report can be produced per student or per mentor.
 *
 * kinds:
 *   GENERAL             free-form mentoring note
 *   CREDIT_COUNSELLING  advice on which subjects/credits to take next (CBCS)
 *   BRANCH_CHANGE       counselling attached to a branch-change request
 *   GRADESHEET_REQUEST  mentor asks the student to upload a gradesheet
 *   ACADEMIC / PERSONAL / CAREER  categorised notes
 */
const RecommendationSchema = new mongoose.Schema(
  {
    basket: { type: mongoose.Schema.Types.ObjectId, ref: 'Basket' },
    basketName: String,
    credits: Number,               // credits advised to take in this basket
    suggestedCourses: String,      // free text list of course codes/titles
    targetSemester: Number,
  },
  { _id: false }
);

const CounsellingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },

    kind: {
      type: String,
      enum: ['GENERAL', 'CREDIT_COUNSELLING', 'BRANCH_CHANGE', 'GRADESHEET_REQUEST', 'ACADEMIC', 'PERSONAL', 'CAREER'],
      default: 'GENERAL',
      index: true,
    },
    mode: { type: String, enum: ['IN_PERSON', 'ONLINE', 'PHONE', 'EMAIL'], default: 'IN_PERSON' },
    subject: String,
    summary: String,               // what was discussed
    advice: String,                // guidance given to the student
    recommendations: [RecommendationSchema], // structured credit advice
    followUpOn: Date,

    // For GRADESHEET_REQUEST lifecycle
    requestStatus: { type: String, enum: ['OPEN', 'FULFILLED', 'CANCELLED'] },
    relatedGradesheet: { type: mongoose.Schema.Types.ObjectId, ref: 'Gradesheet' },
    relatedBranchChange: { type: mongoose.Schema.Types.ObjectId, ref: 'BranchChangeRequest' },

    // Acknowledgement by the student (closes the loop for reports)
    studentAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: Date,

    occurredOn: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByRole: String,
  },
  { timestamps: true }
);

CounsellingSchema.index({ student: 1, occurredOn: -1 });

export default mongoose.models.Counselling || mongoose.model('Counselling', CounsellingSchema);
