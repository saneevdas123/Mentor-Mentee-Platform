import mongoose from 'mongoose';

/**
 * CreditPlan — the basket-wise credit requirement for ONE student.
 * HoD sets how many credits the student must earn in each basket.
 * The Credit Tracker compares this against credits parsed from gradesheets.
 */
const PlanLineSchema = new mongoose.Schema(
  {
    basket: { type: mongoose.Schema.Types.ObjectId, ref: 'Basket' },
    basketName: String,                 // denormalised for display / report stability
    requiredCredits: { type: Number, default: 0 },
  },
  { _id: false }
);

const CreditPlanSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, unique: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    programme: String,
    lines: [PlanLineSchema],
    totalRequired: { type: Number, default: 0 },        // usually the sum of line requirements
    creditsPerSemester: { type: Number, default: 20 },  // used to project time-to-completion
    expectedSemesters: { type: Number, default: 8 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CreditPlanSchema.pre('save', function (next) {
  if (!this.totalRequired && this.lines?.length) {
    this.totalRequired = this.lines.reduce((a, l) => a + (l.requiredCredits || 0), 0);
  }
  next();
});

export default mongoose.models.CreditPlan || mongoose.model('CreditPlan', CreditPlanSchema);
