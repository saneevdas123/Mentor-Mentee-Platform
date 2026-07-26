import { getSession } from '@/lib/auth';
import StudentClient from './StudentClient';

export default async function StudentPage() {
  const session = await getSession();
  return <StudentClient me={{ name: session?.name, role: session?.role }} />;
}
