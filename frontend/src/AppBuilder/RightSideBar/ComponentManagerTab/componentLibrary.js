// The component library an app is built in, picked at the top of the Components panel: Rocket 1.0 (ToolJet's own
// widgets), a component pack (Rocket 2.0, Ant Design, Material UI: libraries whose v2 manifest gives each component a
// role) or another custom component library. It is saved per app version in globalSettings.componentLibrary, which
// the MCP and the AI read, so the AI builds the app in the library the user picked:
//   'ui1'              Rocket 1.0
//   'pack:<pack id>'   a component pack, by its manifest's pack id (shadcn, antd, mui)
//   'lib:<library id>' another custom component library (the AI builds such an app in Rocket 1.0)

export const ROCKET_1 = 'ui1';
export const ROCKET_1_LABEL = 'Rocket 1.0';
const DEFAULT_PACK = 'pack:shadcn';

// What the first-party packs are called in the picker.
const PACK_LABELS = { shadcn: 'Rocket 2.0', antd: 'Ant Design', mui: 'Material UI' };

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
 * The app's library: its saved choice when the picker still offers it; for an app saved before the setting, the pack
 * most of its pack components come from; a blank app the default pack; else Rocket 1.0.
 * @param {string | undefined} saved globalSettings.componentLibrary
 * @param {{ packs: object[], custom: object[] }} choices libraryChoices(...)
 * @param {Record<string, any>} components the current page's components
 */
export const resolveLibraryChoice = (saved, choices, components = {}) => {
  const all = [...choices.packs, ...choices.custom];
  if (saved === ROCKET_1) return ROCKET_1;
  if (saved && all.some((choice) => choice.value === saved)) return saved;
  const counts = new Map();
  for (const component of Object.values(components)) {
    if (component?.component?.component !== 'LibraryComponent') continue;
    const properties = component.component.definition?.properties ?? {};
    const libraryId = properties.libraryId?.value;
    const choice = choices.packs.find((c) => c.library.id === libraryId);
    if (choice) counts.set(choice.value, (counts.get(choice.value) ?? 0) + 1);
  }
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (top) return top[0];
  // A blank app is built in the default pack (the AI's too: MCP_AGENT_PACK), Rocket 2.0 where it is installed.
  if (Object.keys(components).length === 0)
    return choices.packs.find((choice) => choice.value === DEFAULT_PACK)?.value ?? ROCKET_1;
  return ROCKET_1;
};

export const choiceLabel = (value, choices) =>
  value === ROCKET_1
    ? ROCKET_1_LABEL
    : ([...choices.packs, ...choices.custom].find((choice) => choice.value === value)?.label ?? ROCKET_1_LABEL);
