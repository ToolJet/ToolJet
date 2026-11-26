// Widgets that draw a component built with the custom-component SDK (SdkComponentHost): an uploaded library's
// (LibraryComponent) or a pack's that ships with ToolJet (PackComponent). Both have ToolJet.Slot drop areas (canvases
// named `<componentId>-<slotName>`), list rows (ToolJet.RowSlot) and Form fields the same way.
export const SDK_COMPONENT_TYPES = ['LibraryComponent', 'PackComponent'];

export const isSdkComponentType = (type: string | undefined): boolean => !!type && SDK_COMPONENT_TYPES.includes(type);

/** The part of a component's manifest entry that says how its height can follow its content. */
interface FitManifest {
  fit?: boolean;
  slots?: { kind?: string }[];
}

/** Whether a component has drop areas drawn in place (a Card's body, a Tabs pane). A popup's body and a list's rows are
 *  drawn by the component's code, not in place. */
export const holdsComponentsInPlace = (component: FitManifest | undefined): boolean =>
  !!component?.slots?.some((slot) => slot.kind !== 'popup' && slot.kind !== 'rows');

/** Whether a component has a drop area in a popup (a Dialog's body), drawn outside the widget's box. */
export const holdsComponentsInPopup = (component: FitManifest | undefined): boolean =>
  !!component?.slots?.some((slot) => slot.kind === 'popup');

/** Whether a component's box can fit its content when the builder turns on Dynamic height. Its manifest says so (fit),
 *  or it holds components in place: the host sizes those drop areas to the components in them, so a container fits
 *  whatever its own code draws. */
export const canFitContent = (component: FitManifest | undefined): boolean =>
  component?.fit === true || holdsComponentsInPlace(component);

/** Whether the Inspector offers Dynamic height, and the host honours it: the component's box can fit its content, or a
 *  popup's body grows with the components in it, as a native Modal's does. */
export const offersDynamicHeight = (component: FitManifest | undefined): boolean =>
  canFitContent(component) || holdsComponentsInPopup(component);
