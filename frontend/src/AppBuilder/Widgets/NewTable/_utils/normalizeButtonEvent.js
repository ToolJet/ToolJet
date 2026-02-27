// Maps user-friendly action labels (as shown in the EventManager UI) to internal actionId values.
// Users writing dynamic column JSON can use these labels instead of memorizing internal keys.
const ACTION_LABEL_TO_ID = {
  'run query': 'run-query',
  'reset query': 'reset-query',
  'show alert': 'show-alert',
  'control component': 'control-component',
  'show modal': 'show-modal',
  'close modal': 'close-modal',
  'set table page': 'set-table-page',
  'scroll component into view': 'scroll-component-into-view',
  'switch page': 'switch-page',
  'go to app': 'go-to-app',
  'open webpage': 'open-webpage',
  'set page variable': 'set-page-variable',
  'unset page variable': 'unset-page-variable',
  'unset all page variables': 'unset-all-page-variables',
  'set variable': 'set-custom-variable',
  'unset variable': 'unset-custom-variable',
  'unset all variables': 'unset-all-custom-variables',
  'logout': 'logout',
  'generate file': 'generate-file',
  'set local storage': 'set-localstorage-value',
  'copy to clipboard': 'copy-to-clipboard',
  'toggle app mode': 'toggle-app-mode',
};

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
    const available = Object.keys(ACTION_LABEL_TO_ID).map((k) => `"${k}"`).join(', ');
    console.warn(
      `[Table] Unknown action "${actionLabel}" in button "${buttonId}". Available actions: ${available}`
    );
    return null;
  }

  // Map event label → eventId
  const eventId = eventLabel ? EVENT_LABEL_TO_ID[eventLabel.toLowerCase()] : 'onClick';

  return { ...rest, eventId, actionId };
}
