// React works out onMouseEnter and onPointerEnter from the element the pointer left. A pack draws into ToolJet's React
// tree through shadow roots (its widget's root and the library's popup layer), and from outside a shadow root an
// element inside it looks like the root's host. So when the pointer came from an element of another root (the canvas,
// another widget, a widget's popup list), React left the enter to the listener that saw the pointer leave, which cannot
// see into this root, and no element in it was entered: an Ant Design Menu's sub-menu never opened from the canvas, and
// closed as the pointer moved from its title into the list (QA AD-04).
//
// When the pointer crosses into the root from outside it, the relay tells React the pointer came from no element: an
// out event on the root's container, which React does not manage, makes React enter every element from the target up,
// as for a pointer coming onto the page. Over handlers (onMouseOver) see nothing new. Moves inside the root, and from a
// component in one of the widget's slots (its out event passes through the root), stay React's own.

type OverType = 'mouseover' | 'pointerover';

const OUT_TYPE: Record<OverType, string> = { mouseover: 'mouseout', pointerover: 'pointerout' };

const outEventFor = (over: MouseEvent, target: Element): MouseEvent => {
  const init: MouseEventInit = {
    bubbles: true,
    // Kept inside the root: only React's listener on the container acts on it.
    composed: false,
    relatedTarget: target,
    clientX: over.clientX,
    clientY: over.clientY,
    screenX: over.screenX,
    screenY: over.screenY,
    ctrlKey: over.ctrlKey,
    shiftKey: over.shiftKey,
    altKey: over.altKey,
    metaKey: over.metaKey,
    buttons: over.buttons,
  };
  const type = OUT_TYPE[over.type as OverType];
  if (typeof PointerEvent !== 'undefined' && over instanceof PointerEvent) {
    return new PointerEvent(type, {
      ...init,
      pointerId: over.pointerId,
      pointerType: over.pointerType,
      isPrimary: over.isPrimary,
    });
  }
  return new MouseEvent(type, init);
};

/** Relays an enter React misses into `root`, whose pack elements React renders into `container`. Returns the undo. */
export const relayPointerEnter = (root: ShadowRoot, container: HTMLElement): (() => void) => {
  const onOver = (e: Event) => {
    const over = e as MouseEvent;
    const from = over.relatedTarget;
    // From outside the page React enters every element itself; inside the root it sees both ends.
    if (!(from instanceof Node) || root.contains(from)) return;
    const host = root.host;
    if (from !== host && host.contains(from)) return;
    const target = over.composedPath()[0];
    if (!(target instanceof Element) || !root.contains(target)) return;
    container.dispatchEvent(outEventFor(over, target));
  };
  root.addEventListener('mouseover', onOver, true);
  root.addEventListener('pointerover', onOver, true);
  return () => {
    root.removeEventListener('mouseover', onOver, true);
    root.removeEventListener('pointerover', onOver, true);
  };
};
