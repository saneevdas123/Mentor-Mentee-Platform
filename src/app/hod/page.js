import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import HodClient from './HodClient';

export default async function HodPage() {
  const session = await getSession();
  let departmentName = '';
  if (session?.department) {
    await dbConnect();
    const d = await Department.findById(session.department).select('name code').lean();
    departmentName = d ? `${d.name} (${d.code})` : '';
  }
  return <HodClient me={{ name: session?.name, role: session?.role, departmentName }} />;
}
