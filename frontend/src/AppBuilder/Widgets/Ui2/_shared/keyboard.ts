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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
