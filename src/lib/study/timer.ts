/** Format seconds as MM:SS. */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Calculate timer duration based on question count. */
export function calculateTimerDuration(questionCount: number): number {
  return questionCount > 25 ? 45 * 60 : 22 * 60;
}
