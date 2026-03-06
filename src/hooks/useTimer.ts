import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Restore state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reading_timer_state');
    if (saved) {
      const { sessionId, startTime, isActive } = JSON.parse(saved);
      if (isActive && startTime) {
        setSessionId(sessionId);
        setStartTime(startTime);
        setIsActive(true);
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem('reading_timer_state', JSON.stringify({ sessionId, startTime, isActive }));
    } else {
      localStorage.removeItem('reading_timer_state');
    }
  }, [isActive, sessionId, startTime]);

  // Timer interval
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startTime]);

  const start = (id: number, time: string) => {
    const startMs = new Date(time).getTime();
    setSessionId(id);
    setStartTime(startMs);
    setIsActive(true);
    setElapsed(0);
  };

  const stop = () => {
    setIsActive(false);
    setStartTime(null);
    setSessionId(null);
    setElapsed(0);
  };

  return { isActive, elapsed, sessionId, start, stop };
}
