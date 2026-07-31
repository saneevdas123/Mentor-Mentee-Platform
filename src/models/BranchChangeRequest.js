import mongoose from 'mongoose';

/**
 * BranchChangeRequest — raised by a FIRST-YEAR student who wants to change
 * programme/branch. It must pass through mentor counselling before an HoD/Dean
 * records the final decision. Every step is timestamped for the record.
 */
const BranchChangeRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },

    currentProgramme: String,
    requestedProgramme: { type: String, required: true },
    reason: String,
    currentCGPA: Number,          // captured at request time (eligibility context)

    status: {
      type: String,
      enum: ['REQUESTED', 'COUNSELLED', 'RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
      default: 'REQUESTED',
      index: true,
    },

    // Mentor counselling step
    mentorCounselledOn: Date,
    mentorRemarks: String,
    mentorRecommends: Boolean,

    // HoD / Dean final decision
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedByRole: String,
    decisionOn: Date,
    decisionRemarks: String,

    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.BranchChangeRequest ||
  mongoose.model('BranchChangeRequest', BranchChangeRequestSchema);
