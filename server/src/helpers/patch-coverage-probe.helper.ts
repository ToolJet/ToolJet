// Throwaway probe for the Patch Coverage CI gate — delete before merge.
export function classifyScore(score: number): 'low' | 'mid' | 'high' {
  if (score < 30) {
    return 'low';
  }
  if (score < 70) {
    return 'mid';
  }
  return 'high';
}

export function summarizeScores(scores: number[]): Record<'low' | 'mid' | 'high', number> {
  const summary = { low: 0, mid: 0, high: 0 };
  for (const score of scores) {
    summary[classifyScore(score)] += 1;
  }
  return summary;
}
