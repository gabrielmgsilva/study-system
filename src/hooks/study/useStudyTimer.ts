'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseStudyTimerReturn {
  timeLeft: number | null;
  isTimerRunning: boolean;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  /** true when the countdown has reached zero */
  expired: boolean;
}

export function useStudyTimer(
  onExpire?: () => void,
): UseStudyTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      setTimeLeft(0);
      setExpired(true);
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, onExpire]);

  const startTimer = useCallback((seconds: number) => {
    setExpired(false);
    setTimeLeft(seconds);
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(null);
    setIsTimerRunning(false);
    setExpired(false);
  }, []);

  return { timeLeft, isTimerRunning, startTimer, stopTimer, resetTimer, expired };
}
