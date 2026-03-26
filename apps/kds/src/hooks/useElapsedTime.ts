import { useState, useEffect } from 'react';

export type UrgencyLevel = 'normal' | 'warning' | 'critical';

interface UseElapsedTimeReturn {
  elapsedMinutes: number;
  elapsedSeconds: number;
  formattedTime: string;
  urgencyLevel: UrgencyLevel;
}

/**
 * Custom hook to track elapsed time since a given ISO timestamp.
 * Updates every 30 seconds for performance.
 *
 * @param createdAtISO ISO timestamp string (e.g., from order.createdAt)
 * @returns Object with elapsed time info and urgency level
 *
 * Urgency levels:
 * - normal: < 10 minutes (gold timer)
 * - warning: 10-20 minutes (crimson timer)
 * - critical: > 20 minutes (red flashing timer)
 */
export function useElapsedTime(createdAtISO: string): UseElapsedTimeReturn {
  const [elapsed, setElapsed] = useState<UseElapsedTimeReturn>({
    elapsedMinutes: 0,
    elapsedSeconds: 0,
    formattedTime: '0 phút',
    urgencyLevel: 'normal',
  });

  useEffect(() => {
    const updateElapsed = (): void => {
      const createdAt = new Date(createdAtISO).getTime();
      const now = Date.now();
      const totalSeconds = Math.floor((now - createdAt) / 1000);

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Determine urgency level
      let urgencyLevel: UrgencyLevel = 'normal';
      if (minutes >= 20) {
        urgencyLevel = 'critical';
      } else if (minutes >= 10) {
        urgencyLevel = 'warning';
      }

      // Format time string
      let formattedTime: string;
      if (minutes === 0) {
        formattedTime = `${seconds}s`;
      } else if (minutes < 60) {
        formattedTime = `${minutes}m ${seconds}s`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        formattedTime = `${hours}h ${remainingMinutes}m`;
      }

      setElapsed({
        elapsedMinutes: minutes,
        elapsedSeconds: totalSeconds,
        formattedTime,
        urgencyLevel,
      });
    };

    // Update immediately
    updateElapsed();

    // Then update every 30 seconds
    const interval = setInterval(updateElapsed, 30000);

    return () => clearInterval(interval);
  }, [createdAtISO]);

  return elapsed;
}
