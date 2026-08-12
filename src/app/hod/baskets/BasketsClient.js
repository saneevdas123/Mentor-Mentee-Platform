'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Credit Baskets live in the HoD sidebar now — keep this route as a redirect. */
export default function BasketsClient() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/hod');
  }, [router]);
  return (
    <div className="p-8 text-sm text-ink/50">
      Opening Credit Baskets in the HoD dashboard…
    </div>
  );
}
