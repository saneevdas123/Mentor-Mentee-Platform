import mongoose from 'mongoose';

/**
 * Gradesheet — a student-uploaded results PDF plus the credits parsed from it.
 * The raw PDF is stored inline (Buffer) so the platform is self-contained;
 * for very large deployments switch this to GridFS / object storage.
 */
const ParsedLineSchema = new mongoose.Schema(
  {
    courseCode: String,
    courseTitle: String,
    credit: { type: Number, default: 0 },
    grade: String,
    passed: { type: Boolean, default: true },
    // Basket the course was mapped to (by parser or manual review).
    basket: { type: mongoose.Schema.Types.ObjectId, ref: 'Basket' },
    basketName: String,               // raw/label as understood
    mappedManually: { type: Boolean, default: false },
  },
  { _id: true }
);

const GradesheetSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },

    semester: Number,
    academicYear: String,
    title: String,                    // e.g. "Semester 3 gradesheet"

    fileName: String,
    mimeType: { type: String, default: 'application/pdf' },
    fileSize: Number,
    fileData: Buffer,                 // raw PDF bytes (kept private; never sent in list responses)

    parsedLines: [ParsedLineSchema],
    rawTextSnippet: String,           // first chunk of extracted text (audit aid)
    detectedSGPA: Number,
    creditsEarnedTotal: { type: Number, default: 0 },

    // Lifecycle: PARSED (auto) -> VERIFIED (mentor confirmed mapping) ; NEEDS_REVIEW if unmapped rows
    status: { type: String, enum: ['PARSED', 'NEEDS_REVIEW', 'VERIFIED'], default: 'PARSED' },
    parseWarning: String,

    // If uploaded in response to a mentor's request (a Counselling GRADESHEET_REQUEST).
    requestRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Counselling' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Gradesheet || mongoose.model('Gradesheet', GradesheetSchema);
