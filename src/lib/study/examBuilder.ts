import type { DeckSection, Question } from './types';
import { shuffleArray } from './optionShuffle';

/** Stable topic key: prefer tcTopicCode, fallback to sectionId. */
export function safeTopicKey(q: Question): string {
  return q.tcTopicCode || `SECTION:${q.sectionId}`;
}

/**
 * Round-robin pick from labeled pools — ensures topic diversity.
 * Mutates the pools by shifting items.
 */
export function roundRobinPick<T>(
  pools: Record<string, T[]>,
  count: number,
): T[] {
  const keys = Object.keys(pools).filter((k) => (pools[k]?.length ?? 0) > 0);
  if (keys.length === 0 || count <= 0) return [];

  const order = shuffleArray(keys);
  const out: T[] = [];

  let guard = 0;
  while (out.length < count && guard < 100_000) {
    guard++;
    let progressed = false;

    for (const k of order) {
      const pool = pools[k];
      if (pool && pool.length > 0) {
        out.push(pool.shift() as T);
        progressed = true;
        if (out.length >= count) break;
      }
    }

    if (!progressed) break;
  }

  return out;
}

/**
 * Build a balanced test exam respecting section weights and topic diversity.
 */
export function buildTestExamQuestions(
  allQs: Question[],
  sections: DeckSection[],
  allSectionIds: string[],
  selectedSectionIds: string[],
  totalQuestions: number,
): Question[] {
  const activeIds =
    selectedSectionIds.length > 0 ? selectedSectionIds : allSectionIds;

  const maxQuestions = Math.min(totalQuestions, allQs.length);
  if (maxQuestions <= 0) return [];

  // 1) Calculate weights per section
  const sectionWeight: Record<string, number> = {};
  let totalWeight = 0;

  for (const sid of activeIds) {
    const w = sections.find((s) => s.id === sid)?.weight ?? 1;
    sectionWeight[sid] = w;
    totalWeight += w;
  }

  // 2) Build pools: section → topicKey → Question[]
  const perSectionTopicPools: Record<string, Record<string, Question[]>> = {};

  for (const sid of activeIds) {
    const sectionQs = allQs.filter((q) => q.sectionId === sid);
    const topicPools: Record<string, Question[]> = {};

    for (const q of shuffleArray(sectionQs)) {
      const key = safeTopicKey(q);
      if (!topicPools[key]) topicPools[key] = [];
      topicPools[key].push(q);
    }

    perSectionTopicPools[sid] = topicPools;
  }

  // 3) Weighted allocation per section using round-robin topic pick
  const selected: Question[] = [];
  const leftovers: Question[] = [];
  let remaining = maxQuestions;

  for (const sid of activeIds) {
    if (remaining <= 0) break;

    const topicPools = perSectionTopicPools[sid] ?? {};
    const availableCount = Object.values(topicPools).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    if (availableCount <= 0) continue;

    const ideal = Math.round(
      (maxQuestions * sectionWeight[sid]) / totalWeight,
    );
    const target = Math.min(ideal, availableCount, remaining);

    const picked = roundRobinPick(topicPools, target);
    selected.push(...picked);
    remaining -= picked.length;

    // Leftover questions from this section for global fill
    const rest = Object.values(topicPools).flat();
    leftovers.push(...rest);
  }

  // 4) Global fill (also mixed by topicKey)
  if (remaining > 0 && leftovers.length > 0) {
    const globalTopicPools: Record<string, Question[]> = {};
    for (const q of shuffleArray(leftovers)) {
      const key = safeTopicKey(q);
      if (!globalTopicPools[key]) globalTopicPools[key] = [];
      globalTopicPools[key].push(q);
    }

    selected.push(...roundRobinPick(globalTopicPools, remaining));
  }

  // 5) Final shuffle + cap
  return shuffleArray(selected).slice(0, maxQuestions);
}
