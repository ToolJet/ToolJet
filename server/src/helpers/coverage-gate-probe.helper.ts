// Throwaway: exercises the run-ci coverage gate. Deleted with the probe PR.
export function classifyCoverage(pct: number): 'low' | 'ok' | 'high' {
  if (pct < 50) {
    return 'low';
  }
  if (pct < 80) {
    return 'ok';
  }
  return 'high';
}
