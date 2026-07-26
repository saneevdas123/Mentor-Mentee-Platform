import mongoose from 'mongoose';

// Explicit mentor <-> mentee mapping (feeds NAAC 2.3.3 ratio and mentor-wise lists).
const MappingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    academicYear: String,
    active: { type: Boolean, default: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MappingSchema.index({ mentor: 1, student: 1, academicYear: 1 }, { unique: true });

export default mongoose.models.Mapping || mongoose.model('Mapping', MappingSchema);
