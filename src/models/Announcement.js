import mongoose from 'mongoose';

// Log of every announcement / notification email sent (governance audit trail).
const AnnouncementSchema = new mongoose.Schema(
  {
    subject: String,
    body: String,
    audience: { type: String, enum: ['MENTORS', 'MENTEES', 'PARENTS', 'ALL'], default: 'ALL' },
    channel: { type: String, enum: ['EMAIL', 'SYSTEM'], default: 'EMAIL' },
    relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    recipients: [String],
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['QUEUED', 'SENT', 'PARTIAL', 'FAILED'], default: 'QUEUED' },
    triggeredBy: { type: String, default: 'SYSTEM' },
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
