/*
  The pop-out panels that are open right now, by name. A leaf module (no imports) so code outside a panel, including
  files the released-app viewer also loads, can ask about panel windows without pulling in the pop-out machinery.
*/

const controllers = new Map();

/** Used by `usePanelPopOut`: `controller` is `{ focus(), window() }`. Returns the function that takes it out again. */
export const registerPanelWindow = (panelId, controller) => {
  controllers.set(panelId, controller);
  return () => {
    if (controllers.get(panelId) === controller) controllers.delete(panelId);
  };
};

/** Brings a panel's window to the front, from anywhere in the editor. False when the panel is docked. */
export const focusPanelWindow = (panelId) => controllers.get(panelId)?.focus() ?? false;

/** The body of the pop-out window the user is working in, if any: where a dialog raised from outside a panel goes. */
export const focusedPanelBody = () => {
  for (const controller of controllers.values()) {
    const doc = controller.window()?.document;
    if (doc?.hasFocus?.()) return doc.body;
  }
  return undefined;
};
