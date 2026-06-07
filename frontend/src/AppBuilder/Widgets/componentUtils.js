import { isEqual } from 'lodash';

export const checkDiff = (prev, next) => {
  if (!prev || !next) return prev === next;

  // Return true if there are no changes (prevents re-render)
  return isEqual(prev, next);
};
