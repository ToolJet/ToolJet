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

const v2Name = (group, token) => RENAMED[group]?.[token] ?? token;
const oldName = (group, token) =>
  Object.keys(RENAMED[group] || {}).find((old) => RENAMED[group][old] === token) ?? token;

/**
 * Returns the definition with `version: 2` and `colors`, keeping every other key (the old groups included). When it
 * already has `colors`, those win; otherwise they are built from the old groups, values copied as stored.
 * Idempotent; does not mutate its input.
 */
export const toV2 = (definition) => {
  const def = definition || {};
  if (def.colors) return { ...def, version: 2 };
  const colors = {};
  GROUPS.forEach((group) => {
    const tokens = def[group]?.colors;
    if (!tokens) return;
    colors[group] = {};
    Object.entries(tokens).forEach(([token, pair]) => {
      if (!DROPPED.includes(token)) colors[group][v2Name(group, token)] = pair;
    });
  });
  return { ...def, version: 2, colors };
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

/**
 * The definition to save, in both shapes. A client sends back the row it read, which holds both shapes: a new client
 * edits `colors` (its old groups come back stale), an old bundle edits the old groups (its `colors` come back stale),
 * tooljet-mcp sends the old groups alone. Per colour, a `colors` value that differs from the stored row is an edit and
 * wins; otherwise the old groups' value does, and a v2-only colour (On solid) keeps its `colors` value.
 * @param {object} incoming  the definition the client sent
 * @param {object} [stored]  the row's current definition; absent when creating
 */
export const resolveThemeWrite = (incoming, stored) => {
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
