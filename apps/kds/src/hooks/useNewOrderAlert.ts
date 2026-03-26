import { useEffect, useRef } from 'react';

/**
 * Custom hook to play a sound effect when triggered.
 * Useful for alerting kitchen staff to new orders.
 *
 * @param trigger Boolean that triggers the sound when it changes to true
 * @param soundUrl Optional custom sound URL (defaults to a web audio API beep)
 */
export function useNewOrderAlert(trigger: boolean, soundUrl?: string): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTrigger = useRef<boolean>(false);

  useEffect(() => {
    if (trigger && !previousTrigger.current) {
      playAlert(soundUrl);
    }
    previousTrigger.current = trigger;
  }, [trigger, soundUrl]);

  function playAlert(url?: string): void {
    // If a custom URL is provided, play that
    if (url) {
      const audio = new Audio(url);
      audio.play().catch((error) => {
        console.warn('Failed to play alert sound:', error);
      });
      return;
    }

    // Otherwise, generate a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create a simple beep: 800Hz for 200ms, then 600Hz for 200ms
      const now = audioContext.currentTime;
      const duration = 0.2; // seconds

      // First beep
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 800;
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);
      osc1.start(now);
      osc1.stop(now + duration);

      // Second beep
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 600;
      gain2.gain.setValueAtTime(0.3, now + duration);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + duration * 2);
      osc2.start(now + duration);
      osc2.stop(now + duration * 2);

      // Log for development
      console.log('New order alert sound played');
    } catch (error) {
      // If Web Audio API fails, just log
      console.warn('Failed to generate alert sound:', error);
      console.log('New order received');
    }
  }
}
