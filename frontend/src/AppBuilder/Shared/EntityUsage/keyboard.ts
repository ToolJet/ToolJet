import type { KeyboardEvent } from 'react';

/** Fires `action` on Enter or Space so a `role="button"` node is keyboard-usable. */
export const activateOnEnterOrSpace = (action?: () => void) => (event: KeyboardEvent) => {
  if (!action) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
};
