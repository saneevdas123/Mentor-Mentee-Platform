import mongoose from 'mongoose';

/**
 * CourseMap — a department-scoped lookup from a course code to a basket.
 * Used by the gradesheet parser to auto-assign a basket when the PDF does not
 * print one. Grows automatically: whenever a mentor manually maps a course
 * during review, that mapping is remembered here for the next upload.
 */
const CourseMapSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    courseTitle: String,
    basket: { type: mongoose.Schema.Types.ObjectId, ref: 'Basket', required: true },
    basketName: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CourseMapSchema.index({ department: 1, courseCode: 1 }, { unique: true });

export default mongoose.models.CourseMap || mongoose.model('CourseMap', CourseMapSchema);
