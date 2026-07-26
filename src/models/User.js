import mongoose from 'mongoose';
import { ROLES } from '@/lib/rbac';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },

    phone: { type: String, trim: true },
    employeeId: { type: String, trim: true }, // for faculty/dean/hod
    designation: { type: String, trim: true },

    // Scope references (nullable depending on role).
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },

    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    // Who provisioned this account (audit trail for NAAC governance).
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, school: 1, department: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
