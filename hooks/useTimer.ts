
import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialStartedAt: number | null) => {
  const [startedAt, setStartedAt] = useState<number | null>(initialStartedAt);
  const [elapsed, setElapsed] = useState<number>(0);

  const calculateElapsed = useCallback(() => {
    if (startedAt) {
      return Date.now() - startedAt;
    }
    return 0;
  }, [startedAt]);

  useEffect(() => {
    if (startedAt) {
      setElapsed(calculateElapsed());
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [startedAt, calculateElapsed]);
  
  const start = () => {
    setStartedAt(Date.now());
  };

  const stop = (): number => {
    const finalElapsed = calculateElapsed();
    setStartedAt(null);
    setElapsed(0);
    return finalElapsed;
  };

  return { isActive: !!startedAt, elapsed, start, stop, startedAt };
};
