import crypto from 'crypto';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sendMail, credentialsEmail } from '@/lib/mailer';

export function tempPassword() {
  // Human-friendly but random: e.g. Cutm-9F3A21
  return `Cutm-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Create a user account, hash a generated (or supplied) password, and email the
 * credentials. Returns the created user and the plaintext temp password.
 */
export async function provisionUser({ name, email, role, phone, employeeId, designation, school, department, createdBy, password }) {
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    const err = new Error('A user with this email already exists.');
    err.code = 'DUP';
    throw err;
  }
  const plain = password || tempPassword();
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    role,
    phone,
    employeeId,
    designation,
    school: school || null,
    department: department || null,
    passwordHash: await hashPassword(plain),
    mustChangePassword: true,
    createdBy: createdBy || null,
  });

  const loginUrl = `${process.env.APP_URL || 'http://localhost:3000'}/login`;
  const { subject, html } = credentialsEmail({ name, email: user.email, tempPassword: plain, role, loginUrl });
  try {
    await sendMail({ to: user.email, subject, html });
  } catch (e) {
    // Non-fatal: account still created; admin can resend.
    console.warn('[provision] credential email failed:', e.message);
  }

  return { user, tempPassword: plain };
}
