import { PointerSensor } from '@dnd-kit/core';

// Custom PointerSensor for Navigation items
// Prevents drag from starting when clicking on popovers or selected text
export class CustomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }) => {
        // Don't start drag if clicking inside popovers
        if (
          event.target.closest('.nav-add-menu-popover') ||
          event.target.closest('.nav-item-actions-popover') ||
          event.target.closest('.nav-item-popover')
        ) {
          return false;
        }

        // Don't start drag if text is selected
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
          return false;
        }

        // Only start drag if the target has data-draggable="true"
        return event.target.closest('[data-draggable="true"]') !== null;
      },
    },
  ];
}
