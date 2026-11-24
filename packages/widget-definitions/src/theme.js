// Theme definition v2: colours live in `colors.<group>.<token>.{light, dark}`. Rows keep the old groups
// (`<group>.colors.<token>`) beside them until a cleanup migration, because older bundles and tooljet-mcp still read
// and write that shape. Shared by the server (read, write, import) and the frontend (CSS variables, colour picker).

const GROUPS = ['brand', 'text', 'surface', 'border', 'systemStatus'];

// Tokens renamed in v2: old name -> v2 name, per group. Strong is the old default border.
const RENAMED = { border: { default: 'strong' } };
// Old tokens v2 drops: nothing reads --cc-disabled-*.
const DROPPED = ['disabled'];
// v2 tokens the old shape never had; kept out of the old groups (the old schema and tooljet-mcp reject them).
const V2_ONLY = { text: ['onSolid'] };

// Built-in border radii and box shadows (the theme design). Locked: editable, never removed; the stable id survives a
// rename. Themes add their own after them. Shadow colour: the box shadow widgets already default to (black at 25%).
const SHADOW_COLOR = '#00000040';
const shadow = (id, y, blur) => ({
  id,
  name: id === 'none' ? 'None' : id,
  x: 0,
  y,
  blur,
  spread: 0,
  color: { light: SHADOW_COLOR, dark: SHADOW_COLOR },
  locked: true,
});
export const DEFAULT_BORDER_RADII = [
  { id: 'none', name: 'None', value: 0, locked: true },
  { id: 'small', name: 'Small', value: 2, locked: true },
  { id: 'medium', name: 'Medium', value: 4, locked: true },
  { id: 'large', name: 'Large', value: 6, locked: true },
];
export const DEFAULT_SHADOWS = [
  shadow('none', 0, 0),
  shadow('100', 2, 4),
  shadow('200', 2, 4),
  shadow('300', 4, 8),
  shadow('400', 8, 16),
  shadow('500', 16, 24),
];
const LISTS = { borderRadius: DEFAULT_BORDER_RADII, shadows: DEFAULT_SHADOWS };
const copy = (value) => JSON.parse(JSON.stringify(value));
// A theme's own lists, else copies of the built-in ones.
const listsOf = (def) =>
  Object.fromEntries(
    Object.entries(LISTS).map(([key, builtIn]) => [key, Array.isArray(def[key]) ? def[key] : copy(builtIn)])
  );

const v2Name = (group, token) => RENAMED[group]?.[token] ?? token;
const oldName = (group, token) =>
  Object.keys(RENAMED[group] || {}).find((old) => RENAMED[group][old] === token) ?? token;

/**
 * Returns the definition with `version: 2`, `colors`, `borderRadius` and `shadows`, keeping every other key (the old
 * groups included). When it already has `colors`, those win; otherwise they are built from the old groups, values
 * copied as stored. Missing lists are the built-in ones. Idempotent; does not mutate its input.
 */
export const toV2 = (definition) => {
  const def = definition || {};
  if (def.colors) return { ...def, version: 2, ...listsOf(def) };
  const colors = {};
  GROUPS.forEach((group) => {
    const tokens = def[group]?.colors;
    if (!tokens) return;
    colors[group] = {};
    Object.entries(tokens).forEach(([token, pair]) => {
      if (!DROPPED.includes(token)) colors[group][v2Name(group, token)] = pair;
    });
  });
  return { ...def, version: 2, colors, ...listsOf(def) };
};

/**
 * Rewrites the old groups' colours from `colors`, so both shapes agree when a v2 definition is saved. Keeps the old
 * groups' other keys (`text.font`, `border.radius`, which the component packs read).
 */
export const withLegacyColors = (definition) => {
  const def = toV2(definition);
  const out = { ...def };
  Object.entries(def.colors).forEach(([group, tokens]) => {
    const colors = {};
    Object.entries(tokens).forEach(([token, pair]) => {
      if (!V2_ONLY[group]?.includes(token)) colors[oldName(group, token)] = pair;
    });
    out[group] = { ...def[group], colors };
  });
  return out;
};

/**
 * Every colour as `{ group, token, cssVar, light, dark }`. The variable names are the ones saved widgets already
 * point at: `--cc-<old token>-<group>` (Strong stays `--cc-default-border`).
 */
export const themeColorTokens = (definition) =>
  Object.entries(toV2(definition).colors).flatMap(([group, tokens]) =>
    Object.entries(tokens).map(([token, pair]) => ({
      group,
      token,
      cssVar: `--cc-${oldName(group, token)}-${group}`,
      light: pair?.light,
      dark: pair?.dark,
    }))
  );

const samePair = (a, b) => a?.light === b?.light && a?.dark === b?.dark;

// Every built-in item first (the client's version of it, else the default), always locked; then the theme's own.
const withBuiltIns = (list, builtIns) => [
  ...builtIns.map((builtIn) => ({ ...(list.find((item) => item.id === builtIn.id) ?? copy(builtIn)), locked: true })),
  ...list.filter((item) => !builtIns.some((builtIn) => builtIn.id === item.id)),
];

/**
 * The definition to save, in both shapes. A client sends back the row it read, which holds both shapes: a new client
 * edits `colors` (its old groups come back stale), an old bundle edits the old groups (its `colors` come back stale),
 * tooljet-mcp sends the old groups alone. Per colour, a `colors` value that differs from the stored row is an edit and
 * wins; otherwise the old groups' value does, and a v2-only colour (On solid) keeps its `colors` value.
 * @param {object} incoming  the definition the client sent
 * @param {object} [stored]  the row's current definition; absent when creating
 */
export const resolveThemeWrite = (incoming, stored) => {
  // Border radii and shadows: the lists sent, else the stored ones (a client that does not know them sends none).
  const out = resolveColors(incoming, stored);
  Object.entries(LISTS).forEach(([key, builtIns]) => {
    const list = Array.isArray(incoming?.[key]) ? incoming[key] : toV2(stored)[key];
    out[key] = withBuiltIns(list, builtIns);
  });
  return out;
};

const resolveColors = (incoming, stored) => {
  const sent = incoming?.colors;
  if (!sent) return withLegacyColors(incoming);
  const before = stored ? toV2(stored).colors : {};
  const { colors: _ignored, ...oldGroupsOnly } = incoming;
  const fromOldGroups = toV2(oldGroupsOnly).colors;
  const colors = {};
  new Set([...Object.keys(sent), ...Object.keys(fromOldGroups)]).forEach((group) => {
    colors[group] = {};
    const tokens = new Set([...Object.keys(sent[group] || {}), ...Object.keys(fromOldGroups[group] || {})]);
    tokens.forEach((token) => {
      const edited = sent[group]?.[token];
      const old = fromOldGroups[group]?.[token];
      colors[group][token] =
        edited !== undefined && (old === undefined || !samePair(edited, before[group]?.[token])) ? edited : old;
    });
  });
  return withLegacyColors({ ...incoming, colors });
};
