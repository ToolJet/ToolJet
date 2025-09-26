// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

export const checkDiff = (prev, next) => {
  if (!prev || !next) return prev === next;

  const diffResult = diff(prev, next);
  // Return true if there are no changes (prevents re-render)
  return !diffResult || Object.keys(diffResult).length === 0;
};
