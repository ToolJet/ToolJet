import { PointerSensor } from '@dnd-kit/core';

export class CustomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }) => {
        if (!event.isPrimary || event.button !== 0 || isInteractiveElement(event.target)) {
          return false;
        }

        return true;
      },
    },
  ];
}

function isInteractiveElement(element) {
  const interactiveElements = ['button', 'input', 'textarea', 'select', 'option', 'a'];

  if (
    interactiveElements.includes(element.tagName.toLowerCase()) ||
    element.closest('button') ||
    element.closest('a') ||
    element.closest('[data-no-drag]') ||
    element.classList.contains('icon-btn') ||
    element.closest('.icon-btn')
  ) {
    return true;
  }

  return false;
}
