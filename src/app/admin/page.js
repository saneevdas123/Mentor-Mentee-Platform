import { getSession } from '@/lib/auth';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await getSession();
  return <AdminClient me={{ name: session?.name, role: session?.role }} />;
}
