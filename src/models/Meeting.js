import mongoose from 'mongoose';

// Scheduled mentoring meetings (weekly mentor-mentee + monthly parent meetings).
const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['WEEKLY_MENTORING', 'MONTHLY_PARENT', 'ADHOC'], default: 'WEEKLY_MENTORING' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },

    scheduledAt: { type: Date, required: true, index: true },
    durationMins: { type: Number, default: 45 },
    meetLink: String,            // Google Meet URL
    calendarEventId: String,     // Google Calendar event id (if created)

    // Recipients captured at schedule time (for the audit trail / minutes).
    menteeEmails: [String],
    parentEmails: [String],
    agenda: String,

    status: { type: String, enum: ['SCHEDULED', 'NOTIFIED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
    notificationSentAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
