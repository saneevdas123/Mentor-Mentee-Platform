import { getSession } from '@/lib/auth';
import MentorClient from './MentorClient';

export default async function MentorPage() {
  const session = await getSession();
  return <MentorClient me={{ name: session?.name, role: session?.role }} />;
}
