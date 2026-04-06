/**
 * Format usage summary for a study mode.
 * `dictionary` must contain the i18n study keys.
 */
export function formatUsageSummary(
  limit: number | null,
  used: number,
  period: string,
  dictionary: {
    unlimitedLabel: string;
    notAvailableLabel: string;
    sessionsToday: string;
    sessionsThisWeek: string;
    sessionsThisMonth: string;
  },
): string {
  if (limit === null) {
    return `${dictionary.unlimitedLabel} ${period}`;
  }

  if (limit <= 0) {
    return `${dictionary.notAvailableLabel} ${period}`;
  }

  if (period === 'day') {
    return `${used}/${limit} ${dictionary.sessionsToday}`;
  }

  if (period === 'week') {
    return `${used}/${limit} ${dictionary.sessionsThisWeek}`;
  }

  return `${used}/${limit} ${dictionary.sessionsThisMonth}`;
}

/** Milliseconds until the next reset boundary. */
export function timeUntilNextReset(
  unit: 'day' | 'week' | 'month',
  now = new Date(),
): number {
  if (unit === 'month') {
    return (
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        0,
        0,
        0,
        0,
      ).getTime() - now.getTime()
    );
  }

  if (unit === 'week') {
    const next = new Date(now);
    const day = next.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    next.setDate(next.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next.getTime() - now.getTime();
  }

  return (
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    ).getTime() - now.getTime()
  );
}

/** Human-readable label for when the limit resets. */
export function formatResetLabel(
  unit: 'day' | 'week' | 'month',
  dictionary: {
    resetsIn: string;
    daySingular: string;
    dayPlural: string;
  },
): string {
  const remainingMs = Math.max(timeUntilNextReset(unit), 0);
  const totalMinutes = Math.max(Math.ceil(remainingMs / 60000), 1);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (unit === 'week' || unit === 'month') {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${dictionary.resetsIn} ${days} ${days === 1 ? dictionary.daySingular : dictionary.dayPlural}`;
    }
    return `${dictionary.resetsIn} ${hours}h ${minutes}m`;
  }

  if (hours <= 0) {
    return `${dictionary.resetsIn} ${minutes}m`;
  }

  return `${dictionary.resetsIn} ${hours}h ${minutes}m`;
}
