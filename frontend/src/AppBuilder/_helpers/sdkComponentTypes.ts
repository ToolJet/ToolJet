// Widgets that draw a component built with the custom-component SDK (SdkComponentHost): an uploaded library's
// (LibraryComponent) or a pack's that ships with ToolJet (PackComponent). Both have ToolJet.Slot drop areas (canvases
// named `<componentId>-<slotName>`), list rows (ToolJet.RowSlot) and Form fields the same way.
export const SDK_COMPONENT_TYPES = ['LibraryComponent', 'PackComponent'];

export const isSdkComponentType = (type: string | undefined): boolean => !!type && SDK_COMPONENT_TYPES.includes(type);
