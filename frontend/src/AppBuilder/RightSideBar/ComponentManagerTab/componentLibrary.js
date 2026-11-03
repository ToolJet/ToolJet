// The component library an app is built in, picked at the top of the Components panel. It is saved per app version in
// globalSettings.componentLibrary, which the MCP and the AI read, so the AI builds the app in the library the user
// picked:
//   'ui1'              ToolJet UI 1.0 (the native widgets)
//   'pack:<pack id>'   a pack that ships with ToolJet (shadcn, antd, mui): PackComponent instances
//   'lib:<library id>' an uploaded custom component library (the AI builds such an app in ToolJet UI 1.0)
// New apps are created on Rocket 2.0 (the shadcn pack). 'ui2' (ToolJet UI 2.0, saved by earlier builds) reads as
// Rocket 2.0; apps from before the setting existed have none, so their library is inferred from what they contain.
export const UI1 = 'ui1';
export const ROCKET_1 = UI1;
export const ROCKET_1_LABEL = 'ToolJet UI 1.0';
export const DEFAULT_PACK = 'pack:shadcn';
const LEGACY_UI2 = 'ui2';

// What the first-party packs are called in the picker, in this order.
const PACK_LABELS = { shadcn: 'Rocket 2.0', antd: 'Ant Design', mui: 'Material UI' };

// A page's components arrive keyed by id, each entry holding the component definition ({ component: { component } }).
const componentType = (entry) => entry?.component?.component ?? entry?.component ?? entry?.type;

/**
 * The picker's choices: the packs this release ships, and the workspace's custom libraries.
 * @param {{ pack: string, displayName: string }[]} packs the shipped packs (builtinPacksStore)
 * @param {{ id: string, name: string }[]} libraries the custom libraries the plan offers ([] without the licence)
 */
export const libraryChoices = (packs = [], libraries = []) => {
  const order = Object.keys(PACK_LABELS);
  const rank = (pack) => {
    const i = order.indexOf(pack);
    return i === -1 ? order.length : i;
  };
  const packChoices = packs
    .map((pack) => ({ value: `pack:${pack.pack}`, label: PACK_LABELS[pack.pack] ?? pack.displayName, pack }))
    .sort((a, b) => rank(a.pack.pack) - rank(b.pack.pack) || a.label.localeCompare(b.label));
  const custom = libraries
    .map((library) => ({ value: `lib:${library.id}`, label: library.name, library }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return { packs: packChoices, custom };
};

/**
 * The app's library: ToolJet UI 1.0 when saved; a saved pack or library while the picker offers it (or before the
 * choices have loaded); for an app saved before the setting, the pack most of its pack components come from; for a
 * blank app (or one saved on ToolJet UI 2.0) Rocket 2.0 where it ships; else ToolJet UI 1.0.
 * @param {string | undefined} saved globalSettings.componentLibrary
 * @param {{ packs: object[], custom: object[] }} choices libraryChoices(...)
 * @param {Record<string, object>} components the current page's components, keyed by id
 */
export const resolveLibraryChoice = (saved, choices, components = {}) => {
  if (saved === UI1) return UI1;
  const all = [...choices.packs, ...choices.custom];
  const offered = (value) => !all.length || all.some((c) => c.value === value);
  if (saved === LEGACY_UI2) return offered(DEFAULT_PACK) ? DEFAULT_PACK : UI1;
  if (typeof saved === 'string' && /^(pack|lib):/.test(saved) && offered(saved)) return saved;
  const counts = new Map();
  let blank = true;
  for (const component of Object.values(components || {})) {
    blank = false;
    if (componentType(component) !== 'PackComponent') continue;
    const value = `pack:${component.component?.definition?.properties?.pack?.value}`;
    if (choices.packs.some((c) => c.value === value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (top) return top[0];
  return blank && choices.packs.some((c) => c.value === DEFAULT_PACK) ? DEFAULT_PACK : UI1;
};

export const choiceLabel = (value, choices) => {
  if (value === UI1) return ROCKET_1_LABEL;
  return [...choices.packs, ...choices.custom].find((choice) => choice.value === value)?.label ?? ROCKET_1_LABEL;
};
