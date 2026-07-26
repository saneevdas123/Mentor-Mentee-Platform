import { getSession } from '@/lib/auth';
import HodClient from './HodClient';

export default async function HodPage() {
  const session = await getSession();
  return <HodClient me={{ name: session?.name, role: session?.role }} />;
}
