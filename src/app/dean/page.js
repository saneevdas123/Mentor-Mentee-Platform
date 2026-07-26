import { getSession } from '@/lib/auth';
import DeanClient from './DeanClient';

export default async function DeanPage() {
  const session = await getSession();
  return <DeanClient me={{ name: session?.name, role: session?.role }} />;
}
