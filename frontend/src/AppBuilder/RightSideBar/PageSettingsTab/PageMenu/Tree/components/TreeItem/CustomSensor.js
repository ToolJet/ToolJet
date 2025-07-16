// src/components/CustomSensors.js (or wherever you defined CustomPointerSensor)

import { PointerSensor as LibPointerSensor, KeyboardSensor as LibKeyboardSensor } from '@dnd-kit/core';
// - IMPORT IT HERE

// Custom PointerSensor
import { PointerSensor } from '@dnd-kit/core';

export class CustomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }) => {
        console.log({ event });
        if (event.target.closest('add-new-page-popup')) {
          return false;
        }

        const selection = window.getSelection();
        if (selection.toString().length > 0) {
          return false;
        }

        return event.target.closest('[data-draggable="true"]') !== null;
      },
    },
  ];
}

const POPOVER_ROOT_ID = 'add-new-page-popup'; // <--- IMPORTANT: Match this with your popover's actual ID!

function shouldHandleEvent(element) {
  let cur = element;
  while (cur) {
    // Check if the current element has the specified popover ID
    console.log({ cur: cur.id, dataset: cur.dataset });
    if (cur.id === POPOVER_ROOT_ID) {
      return false; // Interaction is within the popover, so prevent drag
    }

    // You can keep the data-no-dnd check if you have other elements
    // that should also prevent drag initiation without an ID.
    // If not needed, you can remove this block.
    if (cur.dataset && cur.dataset.noDnd) {
      return false; // Found a non-draggable ancestor (from data-no-dnd attribute)
    }

    cur = cur.parentElement;
  }
  return true; // No blocking ID or data attribute found
}
