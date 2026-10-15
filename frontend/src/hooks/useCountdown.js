import {useEffect, useState} from 'react';

const TICK_MS = 1000;

export function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) {
    return null;
  }
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / TICK_MS));
}
