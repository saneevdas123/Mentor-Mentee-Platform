import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Programmes offered (used for NBA programme-level reporting).
    programmes: [
      {
        name: String,      // e.g. "B.Tech CSE"
        level: String,     // UG / PG / PhD
        durationYears: Number,
        intake: Number,
      },
    ],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DepartmentSchema.index({ school: 1, code: 1 }, { unique: true });

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
