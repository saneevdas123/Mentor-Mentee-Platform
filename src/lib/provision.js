import crypto from 'crypto';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sendMail, credentialsEmail } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

export function tempPassword() {
  return `Cutm-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function emailCredentials({ name, email, tempPassword: plain, role }) {
  const loginUrl = `${getSiteUrl()}/login`;
  const { subject, html, text } = credentialsEmail({ name, email, tempPassword: plain, role, loginUrl });
  try {
    const result = await sendMail({ to: email, subject, html, text });
    if (result?.dryRun) {
      console.warn('[provision] SMTP not configured — credentials were not emailed.');
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[provision] credential email failed:', e.message);
    return false;
  }
}

/**
 * Create a login (or reset an existing same-role login) and email credentials.
 * Returns { user, tempPassword, emailed }.
 */
export async function provisionUser({ name, email, role, phone, employeeId, designation, school, department, createdBy, password }) {
  const normalized = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  const plain = password || tempPassword();

  if (existing) {
    if (existing.role !== role) {
      const err = new Error(`This email is already used by a ${existing.role} account.`);
      err.code = 'DUP_ROLE';
      throw err;
    }
    existing.passwordHash = await hashPassword(plain);
    existing.mustChangePassword = true;
    if (name) existing.name = name;
    if (phone) existing.phone = phone;
    await existing.save();
    const emailed = await emailCredentials({ name: existing.name, email: existing.email, tempPassword: plain, role });
    return { user: existing, tempPassword: plain, emailed, resent: true };
  }

  const user = await User.create({
    name,
    email: normalized,
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

  const emailed = await emailCredentials({ name, email: user.email, tempPassword: plain, role });
  return { user, tempPassword: plain, emailed, resent: false };
}
