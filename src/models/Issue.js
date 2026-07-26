import mongoose from 'mongoose';

// Student-raised issues / grievances (NAAC Criterion 5 & 6 — grievance redressal).
const IssueSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },

    category: {
      type: String,
      enum: ['ACADEMIC', 'ATTENDANCE', 'PLACEMENT', 'FINANCIAL', 'PSYCHOLOGICAL', 'HOSTEL', 'HARASSMENT', 'OTHER'],
      default: 'ACADEMIC',
    },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'], default: 'OPEN' },

    responses: [
      {
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        byName: String,
        byRole: String,
        message: String,
        at: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
