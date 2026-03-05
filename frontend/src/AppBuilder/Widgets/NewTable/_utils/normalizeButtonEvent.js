import { ActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';

// Derives the label-to-id mapping from the canonical ActionTypes array so it stays
// in sync automatically when actions are added or changed.
// Supports both space-separated ("switch page") and collapsed ("switchpage") formats.
const ACTION_LABEL_TO_ID = ActionTypes.reduce((map, action) => {
  const lowerName = action.name.toLowerCase();
  map[lowerName] = action.id;
  // Also add a collapsed (no-spaces) variant for convenience
  const collapsed = lowerName.replace(/\s+/g, '');
  if (collapsed !== lowerName) {
    map[collapsed] = action.id;
  }
  return map;
}, {});

// Maps user-friendly event labels to internal eventId values
const EVENT_LABEL_TO_ID = {
  'on click': 'onClick',
  'on change': 'onChange',
  'on focus': 'onFocus',
  'on blur': 'onBlur',
  'on hover': 'onHover',
};

/**
 * Normalizes a user-friendly button event object into the internal format expected by executeAction.
 *
 * User format:
 *   { event: "On click", action: "Show Alert", message: "Hello!", alertType: "success" }
 *
 * Internal format:
 *   { eventId: "onClick", actionId: "show-alert", message: "Hello!", alertType: "success" }
 *
 * If the event already uses internal keys (actionId), it is passed through unchanged.
 */
export function normalizeButtonEvent(evt, buttonId) {
  // Already in internal format — pass through
  if (evt.actionId) return evt;

  const { event: eventLabel, action: actionLabel, ...rest } = evt;

  // Map action label → actionId
  const actionId = actionLabel ? ACTION_LABEL_TO_ID[actionLabel.toLowerCase()] : undefined;
  if (actionLabel && !actionId) {
    const available = Object.keys(ACTION_LABEL_TO_ID)
      .map((k) => `"${k}"`)
      .join(', ');
    console.warn(`[Table] Unknown action "${actionLabel}" in button "${buttonId}". Available actions: ${available}`);
    return null;
  }

  // Map event label → eventId
  const eventId = eventLabel ? EVENT_LABEL_TO_ID[eventLabel.toLowerCase()] : 'onClick';

  return { ...rest, eventId, actionId };
}
