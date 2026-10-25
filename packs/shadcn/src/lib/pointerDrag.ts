import { useEffect, useRef } from 'react';

interface DragHandlers {
  /** Each pointermove of the dragging pointer. */
  move: (ev: PointerEvent) => void;
  /** The drag ended with pointerup: commit it (fire the change event). */
  commit: () => void;
  /** The drag was cancelled (pointercancel, lost capture, a newer drag, disable): undo what it moved, no event. */
  cancel?: () => void;
}

/**
 * One pointer drag at a time on a captured handle, with a single idempotent teardown. A drag that only removed its
 * listeners on pointerup kept them after a pointercancel or a lost capture (a touch turned scroll, a system gesture),
 * so the next drag's pointerup fired its change event twice (Codex review CODE-06, 2026-10-25). Now pointerup commits,
 * pointercancel and lostpointercapture cancel, events of another pointer are ignored, and `cancel()` (a disable) or the
 * component's unmount tear the drag down; whichever comes first wins and the rest do nothing.
 */
export const usePointerDrag = () => {
  const active = useRef<((how: 'cancel' | 'silent') => void) | null>(null);
  useEffect(() => () => active.current?.('silent'), []);

  const begin = (handle: HTMLElement, pointerId: number, handlers: DragHandlers) => {
    active.current?.('cancel');
    let done = false;
    const mine = (ev: Event) => (ev as PointerEvent).pointerId === undefined || (ev as PointerEvent).pointerId === pointerId;
    const onMove = (ev: Event) => {
      if (!done && mine(ev)) handlers.move(ev as PointerEvent);
    };
    const finish = (how: 'commit' | 'cancel' | 'silent') => {
      if (done) return;
      done = true;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onCancel);
      handle.removeEventListener('lostpointercapture', onCancel);
      try {
        if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
      } catch {
        // The pointer is already gone.
      }
      if (active.current === stop) active.current = null;
      if (how === 'commit') handlers.commit();
      else if (how === 'cancel') handlers.cancel?.();
    };
    const onUp = (ev: Event) => mine(ev) && finish('commit');
    const onCancel = (ev: Event) => mine(ev) && finish('cancel');
    const stop = (how: 'cancel' | 'silent') => finish(how);
    active.current = stop;
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
    handle.addEventListener('lostpointercapture', onCancel);
    try {
      handle.setPointerCapture?.(pointerId);
    } catch {
      // A synthetic or already released pointer: the handle's own listeners still see its events.
    }
  };

  return { begin, cancel: () => active.current?.('cancel') };
};
