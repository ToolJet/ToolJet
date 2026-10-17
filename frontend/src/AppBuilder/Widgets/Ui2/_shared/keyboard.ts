// ToolJet UI 2.0: keyboard handling the widgets share.
import type { KeyboardEvent } from 'react';

/** Enter or Space activates an element acting as a button. */
export const onKeyActivate =
  <E extends Element>(handler: (e: KeyboardEvent<E>) => void) =>
  (e: KeyboardEvent<E>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
