'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotFoundRedirect() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) {
      router.push('/');
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, router]);

  return (
    <p className="text-sm mt-4" style={{ color: '#999' }}>
      Redirecting to the homepage in {seconds}…
    </p>
  );
}
