import { getSession } from '@/lib/auth';
import BasketsClient from './BasketsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getSession();
  return <BasketsClient me={{ name: session?.name, role: session?.role }} />;
}
