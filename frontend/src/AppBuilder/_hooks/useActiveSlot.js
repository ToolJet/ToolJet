import { useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useIsWidgetSelected = (id) => {
  // Get selected components from store using shallow comparison
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);

  // Check if the only selected component is the provided `id`
  return selectedComponents.length === 1 && selectedComponents[0] === id;
};

/**
 * Walk up from the clicked element to the nearest sub-canvas and return its slot id.
 *
 * `allowSlots` is what separates the two gestures:
 * - a double-click may land on a header or footer slot
 * - a single click may not and keeps walking past them to the main canvas.
 *
 * Returns null when the click was outside every sub-canvas.
 */
function resolveSlotId(target, { allowSlots }) {
  while (target && target !== document.body) {
    if (target.id?.startsWith('canvas-')) {
      const isSideSlot = target.id.endsWith('-header') || target.id.endsWith('-footer');
      if (allowSlots || !isSideSlot) return target.id.replace(/^canvas-/, '');
    }
    target = target.parentElement;
  }
  return null;
}

/**
 * ONE pair of document listeners for every widget using this hook, not one pair each.
 *
 * Container, Accordion, Form and ModalV2 all call `useActiveSlot` once per instance.
 * With a listener pair per instance, a page of N such widgets ran 2N document handlers,
 * on every click each repeating the same ancestor walk.
 * The walk depends only on the event, so it runs once here and the result fans out to subscribers.
 */
const subscribers = new Set();
let detach = null;

function broadcast(event, allowSlots) {
  const slotId = resolveSlotId(event.target, { allowSlots });
  // Copied first: a subscriber may unsubscribe while this is iterating.
  for (const notify of [...subscribers]) notify(slotId);
}

function subscribe(notify) {
  subscribers.add(notify);

  if (!detach) {
    const onDoubleClick = (event) => broadcast(event, true);
    const onSingleClick = (event) => broadcast(event, false);

    document.addEventListener('dblclick', onDoubleClick);
    document.addEventListener('click', onSingleClick);

    detach = () => {
      document.removeEventListener('dblclick', onDoubleClick);
      document.removeEventListener('click', onSingleClick);
      detach = null;
    };
  }

  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) detach?.();
  };
}

/**
 * `isEditing` is a parameter rather than a store read because every caller already knows the
 * mode, and reading it here would add one subscription per widget instance — the very
 * per-instance cost the shared listener above removes. It defaults to true so a caller that
 * forgets it keeps working and merely loses the optimisation, instead of silently losing its
 * resize handle.
 */
export const useActiveSlot = (widgetId, isEditing = true) => {
  const [activeSlot, setActiveSlot] = useState(''); // Default to widget ID
  const isSelected = useIsWidgetSelected(widgetId); // Check if widget is selected

  useEffect(() => {
    if (!isSelected) {
      setActiveSlot('');
    }
  }, [isSelected]);

  useEffect(() => {
    if (!isEditing) {
      // Leaving edit mode drops the subscription and clears the highlight.
      setActiveSlot('');
      return undefined;
    }

    return subscribe((slotId) => {
      if (!widgetId) {
        setActiveSlot(null);
        return;
      }
      // No sub-canvas under the click falls back to this widget's own id, exactly as the per-instance listeners did.
      setActiveSlot(slotId ?? widgetId);
    });
  }, [widgetId, isEditing]);

  return activeSlot;
};
