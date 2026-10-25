// The component library an app is built in, picked in the Components panel. It is saved per app version in
// globalSettings.componentLibrary, which the MCP and the AI read, so the AI builds the app in the library the user
// picked:
//   'ui1'              ToolJet UI 1.0 (the native widgets)
//   'ui2'              ToolJet UI 2.0 (the Shad* widgets)
//   'pack:<pack id>'   a component pack, by its manifest's pack id (shadcn, antd, mui)
//   'lib:<library id>' another custom component library (the AI builds such an app in ToolJet UI 1.0)
// New apps are created with 'ui2'; apps from before the setting existed have none, so their library is inferred from
// what they already contain.
export const UI1 = 'ui1';
export const UI2 = 'ui2';
export const COMPONENT_LIBRARY_VALUES = [UI1, UI2];

export const ROCKET_1 = UI1;
export const ROCKET_1_LABEL = 'ToolJet UI 1.0';
export const UI2_LABEL = 'ToolJet UI 2.0';

// What the first-party packs are called in the picker.
const PACK_LABELS = { shadcn: 'Rocket 2.0', antd: 'Ant Design', mui: 'Material UI' };

const isPackType = (type) => typeof type === 'string' && type.startsWith('Shad');

// A page's components arrive keyed by id, each entry holding the component definition ({ component: { component } }).
const componentType = (entry) => entry?.component?.component ?? entry?.component ?? entry?.type;

export const appUsesPackComponents = (pages = []) =>
  (pages || []).some((page) => Object.values(page?.components || {}).some((entry) => isPackType(componentType(entry))));

// { library, source }: the saved setting when it is ToolJet UI 1.0 or 2.0, else 'ui2' for an app that already holds a
// UI 2.0 widget and 'ui1' for everything else.
export const resolveComponentLibrary = (globalSettings, pages) => {
  const saved = globalSettings?.componentLibrary;
  if (COMPONENT_LIBRARY_VALUES.includes(saved)) return { library: saved, source: 'saved' };
  return { library: appUsesPackComponents(pages) ? UI2 : UI1, source: 'inferred' };
};

/** The pack id of a library that is a component pack (a v2 manifest whose components declare roles), else undefined. */
export const packIdOf = (library) => {
  const manifest = library?.manifest;
  if (manifest?.manifestVersion !== 2 || !manifest.pack) return undefined;
  return Object.values(manifest.components ?? {}).some((component) => component?.role) ? manifest.pack : undefined;
};

/** The picker's choices: the packs (their libraries) and the other custom libraries, each { value, label, library }. */
export const libraryChoices = (libraries = []) => {
  const packs = [];
  const custom = [];
  for (const library of libraries) {
    const pack = packIdOf(library);
    if (pack) packs.push({ value: `pack:${pack}`, label: PACK_LABELS[pack] ?? library.name, library });
    else custom.push({ value: `lib:${library.id}`, label: library.name, library });
  }
  const order = Object.keys(PACK_LABELS);
  const rank = (choice) => {
    const i = order.indexOf(choice.value.slice(5));
    return i === -1 ? order.length : i;
  };
  packs.sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
  custom.sort((a, b) => a.label.localeCompare(b.label));
  return { packs, custom };
};

/**
 * The app's library: ToolJet UI 1.0 or 2.0 when saved; a saved pack or library while the picker offers it (or before
 * the libraries have loaded); for an app saved before the setting, the pack most of its pack components come from;
 * else what resolveComponentLibrary infers.
 * @param {string | undefined} saved globalSettings.componentLibrary
 * @param {{ packs: object[], custom: object[] }} choices libraryChoices(...)
 * @param {object[]} pages the app's pages, each with its components keyed by id
 */
export const resolveLibraryChoice = (saved, choices, pages = []) => {
  if (COMPONENT_LIBRARY_VALUES.includes(saved)) return saved;
  const all = [...choices.packs, ...choices.custom];
  if (typeof saved === 'string' && /^(pack|lib):/.test(saved) && (!all.length || all.some((c) => c.value === saved)))
    return saved;
  const counts = new Map();
  for (const page of pages || []) {
    for (const component of Object.values(page?.components || {})) {
      if (componentType(component) !== 'LibraryComponent') continue;
      const libraryId = component.component?.definition?.properties?.libraryId?.value;
      const choice = choices.packs.find((c) => c.library.id === libraryId);
      if (choice) counts.set(choice.value, (counts.get(choice.value) ?? 0) + 1);
    }
  }
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (top) return top[0];
  return resolveComponentLibrary({}, pages).library;
};

export const choiceLabel = (value, choices) => {
  if (value === UI1) return ROCKET_1_LABEL;
  if (value === UI2) return UI2_LABEL;
  return [...choices.packs, ...choices.custom].find((choice) => choice.value === value)?.label ?? ROCKET_1_LABEL;
};
