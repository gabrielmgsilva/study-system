import { describe, it, expect } from 'vitest';

import { formatTime, calculateTimerDuration } from '../timer';

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats less than a minute', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('formats exact minutes', () => {
    expect(formatTime(120)).toBe('02:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(2700)).toBe('45:00');
    expect(formatTime(1320)).toBe('22:00');
  });

  it('pads single digits', () => {
    expect(formatTime(61)).toBe('01:01');
  });
});

describe('calculateTimerDuration', () => {
  it('returns 22 min (1320s) for ≤25 questions', () => {
    expect(calculateTimerDuration(25)).toBe(1320);
    expect(calculateTimerDuration(1)).toBe(1320);
  });

  it('returns 45 min (2700s) for >25 questions', () => {
    expect(calculateTimerDuration(26)).toBe(2700);
    expect(calculateTimerDuration(50)).toBe(2700);
  });
});
