// The component library an app is built in: ToolJet UI 1.0 (the native widgets) or ToolJet UI 2.0 (the Shad* pack).
// It is saved per app version in globalSettings.componentLibrary. New apps are created with 'ui2'; apps from before the
// setting existed have none, so their library is inferred from what they already contain.
export const UI1 = 'ui1';
export const UI2 = 'ui2';
export const COMPONENT_LIBRARY_VALUES = [UI1, UI2];

const isPackType = (type) => typeof type === 'string' && type.startsWith('Shad');

// A page's components arrive keyed by id, each entry holding the component definition ({ component: { component } }).
const componentType = (entry) => entry?.component?.component ?? entry?.component ?? entry?.type;

export const appUsesPackComponents = (pages = []) =>
  (pages || []).some((page) => Object.values(page?.components || {}).some((entry) => isPackType(componentType(entry))));

// { library, source }: the saved setting when there is one, else 'ui2' for an app that already holds a UI 2.0 widget
// and 'ui1' for everything else.
export const resolveComponentLibrary = (globalSettings, pages) => {
  const saved = globalSettings?.componentLibrary;
  if (COMPONENT_LIBRARY_VALUES.includes(saved)) return { library: saved, source: 'saved' };
  return { library: appUsesPackComponents(pages) ? UI2 : UI1, source: 'inferred' };
};
