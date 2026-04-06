import { describe, it, expect } from 'vitest';

import { formatUsageSummary, timeUntilNextReset } from '../usageFormat';

const dictionary = {
  unlimitedLabel: 'Unlimited',
  notAvailableLabel: 'Not available',
  sessionsToday: 'sessions today',
  sessionsThisWeek: 'sessions this week',
  sessionsThisMonth: 'sessions this month',
  resetsIn: 'Resets in',
  daySingular: 'day',
  dayPlural: 'days',
};

describe('formatUsageSummary', () => {
  it('shows unlimited for null limit', () => {
    expect(formatUsageSummary(null, 0, 'day', dictionary)).toBe(
      'Unlimited day',
    );
  });

  it('shows not available for 0 limit', () => {
    expect(formatUsageSummary(0, 0, 'day', dictionary)).toBe(
      'Not available day',
    );
  });

  it('shows daily usage', () => {
    expect(formatUsageSummary(5, 2, 'day', dictionary)).toBe(
      '2/5 sessions today',
    );
  });

  it('shows weekly usage', () => {
    expect(formatUsageSummary(3, 1, 'week', dictionary)).toBe(
      '1/3 sessions this week',
    );
  });

  it('shows monthly usage', () => {
    expect(formatUsageSummary(10, 3, 'month', dictionary)).toBe(
      '3/10 sessions this month',
    );
  });
});

describe('timeUntilNextReset', () => {
  it('returns positive value for day', () => {
    const now = new Date(2026, 2, 15, 10, 0, 0); // March 15, 10am
    const ms = timeUntilNextReset('day', now);
    expect(ms).toBeGreaterThan(0);
    // Should be ~14 hours
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('returns positive value for week', () => {
    const now = new Date(2026, 2, 18, 10, 0, 0); // Wednesday
    const ms = timeUntilNextReset('week', now);
    expect(ms).toBeGreaterThan(0);
  });

  it('returns positive value for month', () => {
    const now = new Date(2026, 2, 15, 10, 0, 0);
    const ms = timeUntilNextReset('month', now);
    expect(ms).toBeGreaterThan(0);
  });
});
