import type { MouseEvent } from 'react';

/**
 * An onMouseOver handler that runs `run` when the pointer comes onto the element from outside it, as onMouseEnter
 * would. A pack draws into ToolJet's own React tree through a shadow root, and React works out an enter from the
 * element the pointer left: when that is the ToolJet canvas, React leaves it to the canvas's listener, which can't see
 * into the shadow root, so onMouseEnter never ran for a widget the pointer reached straight from the canvas (QA item
 * 20). mouseover reaches the element as any event does; moves between its own children are skipped.
 */
export const onPointerIn =
  (run: () => void) =>
  (event: MouseEvent<Element>): void => {
    const from = event.relatedTarget;
    if (from instanceof Node && event.currentTarget.contains(from)) return;
    run();
  };
