// ToolJet UI 2.0: keyboard handling the widgets share.
import type { KeyboardEvent } from 'react';

/** Whether a key event belongs to an IME composition (Japanese, Chinese, Korean input): the Enter that confirms the
 *  composed characters is not the user pressing Enter. keyCode 229 is how some browsers mark it. */
export const isComposing = (e: KeyboardEvent<Element>): boolean =>
  !!(e.nativeEvent as { isComposing?: boolean } | undefined)?.isComposing || e.keyCode === 229;

/** Enter pressed by the user: not the Enter that ends a composition. */
export const isEnter = (e: KeyboardEvent<Element>): boolean => e.key === 'Enter' && !isComposing(e);

/** Enter or Space activates an element acting as a button. */
export const onKeyActivate =
  <E extends Element>(handler: (e: KeyboardEvent<E>) => void) =>
  (e: KeyboardEvent<E>) => {
    if (isComposing(e)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };

/** Whether a key was pressed on the element whose handler runs, not on a control inside it. A parent's own shortcuts (a
 *  Kanban card's Space to move it, a picker field's Enter to open and Backspace to drop its last chip) take only these
 *  keys: one typed in a field, or pressed on a button, inside the parent belongs to that control. */
export const fromOwnSurface = (e: KeyboardEvent<Element>): boolean => e.target === e.currentTarget;
