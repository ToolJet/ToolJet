// The public contract of a UI 2.0 widget: every name and default an app saved under an earlier release can rely on.
// A saved app names property, style and validation keys, event ids, action handles (with their parameters, passed by
// position) and exposed value keys; and an app that never set a property (AI-built apps save only what they set) gets
// its default. `npm run ui2:contracts` freezes this per widget in Ui2/__contracts__/<Type>.json, and
// contracts.spec.js fails when a config drifts from it in a way saved apps would notice.
//
// Plain module with relative imports only: scripts/ui2-contracts.js loads it under Node as well as Jest.

const AREAS = ['property', 'style', 'validation', 'event', 'action', 'exposed'];

const schemaType = (schema) => {
  if (!schema || !schema.type) return 'any';
  if (schema.type === 'union') return `union<${(schema.schemas || []).map(schemaType).join('|')}>`;
  if (schema.type === 'array' && schema.element) return `array<${schemaType(schema.element)}>`;
  return schema.type;
};

/** A default as the resolver sees it: a switch's `{ value }` default is its value. */
const defaultOf = (def) => {
  const value = def?.validation?.defaultValue ?? def?.defaultValue;
  return value !== null && typeof value === 'object' && !Array.isArray(value) && 'value' in value ? value.value : value;
};

/** A schema with its keys in order, so two configs with the same rules freeze to the same text. */
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((k) => [k, canonical(value[k])])
  );
};

/** The keys a saved component carries: the inspector's, and those only its definition has (Tabs' tabItems, Dialog's
 *  headerHeight), which the editor saves too. */
// An inspector heading (type sectionSubHeader) is not a property: nothing is saved under it.
const savedKeys = (defs, created) =>
  [...new Set([...Object.keys(defs || {}), ...Object.keys(created || {})])]
    .filter((key) => defs?.[key]?.type !== 'sectionSubHeader')
    .sort();

const keyed = (defs, created) =>
  Object.fromEntries(
    savedKeys(defs, created).map((key) => {
      const schema = defs?.[key]?.validation?.schema;
      // The type summary reads at a glance; the whole schema (pattern, size, optional, an object's fields) is what a
      // saved value is checked against.
      const entry = { type: schemaType(schema) };
      if (schema) entry.schema = canonical(schema);
      const fallback = defaultOf(defs?.[key]);
      if (fallback !== undefined) entry.default = fallback;
      if (created?.[key]?.value !== undefined) entry.initial = created[key].value;
      return [key, entry];
    })
  );

/** The contract of one widget config, in the shape written to __contracts__/<Type>.json. */
export function contractOf(config) {
  const definition = config.definition || {};
  return {
    type: config.name,
    properties: keyed(config.properties, definition.properties),
    styles: keyed(config.styles, definition.styles),
    validation: Object.fromEntries(
      savedKeys(config.validation, definition.validation).map((key) => [
        key,
        definition.validation?.[key]?.value !== undefined ? { initial: definition.validation[key].value } : {},
      ])
    ),
    events: Object.keys(config.events || {}).sort(),
    actions: Object.fromEntries(
      (config.actions || [])
        .map((a) => [a.handle, (a.params || []).map((p) => p.handle)])
        .sort(([a], [b]) => a.localeCompare(b))
    ),
    exposed: Object.keys(config.exposedVariables || {}).sort(),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const AREA_KEY = {
  property: 'properties',
  style: 'styles',
  validation: 'validation',
  event: 'events',
  action: 'actions',
  exposed: 'exposed',
};
const namesIn = (contract, area) => {
  const value = contract[AREA_KEY[area]];
  return Array.isArray(value) ? value : Object.keys(value || {});
};

/**
 * Every difference between a frozen contract and the live one, as
 * `{ type, area, key, change, from, to }` with change one of: added, removed, default, initial, valueType, rules,
 * params.
 * A whole widget appearing or disappearing is area 'widget'.
 */
export function diffContract(frozen, live) {
  const type = (frozen || live).type;
  if (!frozen) return [{ type, area: 'widget', key: type, change: 'added' }];
  if (!live) return [{ type, area: 'widget', key: type, change: 'removed' }];
  const changes = [];
  for (const area of AREAS) {
    const before = namesIn(frozen, area);
    const after = namesIn(live, area);
    for (const key of before.filter((k) => !after.includes(k))) changes.push({ type, area, key, change: 'removed' });
    for (const key of after.filter((k) => !before.includes(k))) changes.push({ type, area, key, change: 'added' });
    for (const key of before.filter((k) => after.includes(k))) {
      const was = frozen[AREA_KEY[area]][key];
      const now = live[AREA_KEY[area]][key];
      if (area === 'action' && !same(was, now)) changes.push({ type, area, key, change: 'params', from: was, to: now });
      if (!['property', 'style', 'validation'].includes(area)) continue;
      for (const [field, change] of [
        ['default', 'default'],
        ['initial', 'initial'],
        ['type', 'valueType'],
      ]) {
        if (!same(was[field], now[field])) changes.push({ type, area, key, change, from: was[field], to: now[field] });
      }
      // Rules within the same type (a pattern, a size, optional, an object's fields); a type change says it already.
      if (same(was.type, now.type) && !same(was.schema, now.schema))
        changes.push({ type, area, key, change: 'rules', from: was.schema, to: now.schema });
    }
  }
  return changes;
}

const matchesAccepted = (change, accepted) =>
  accepted.find(
    (a) => a.type === change.type && a.area === change.area && a.key === change.key && a.change === change.change
  );

/**
 * Sorts each change into what the contract allows:
 *  - addition: new names, safe; the contract file only needs `npm run ui2:contracts`.
 *  - accepted: listed in __contracts__/acceptedBreaks.json with a reason.
 *  - break: anything else; saved apps would notice.
 */
export function classify(changes, { acceptedBreaks }) {
  return changes.map((change) => {
    if (change.change === 'added') return { ...change, verdict: 'addition' };
    const accepted = matchesAccepted(change, acceptedBreaks);
    if (accepted) return { ...change, verdict: 'accepted', reason: accepted.reason };
    return { ...change, verdict: 'break' };
  });
}

const AREA_WORDS = {
  property: 'property',
  style: 'style',
  validation: 'validation rule',
  event: 'event',
  action: 'action',
  exposed: 'exposed value',
  widget: 'widget',
};

const IMPACT = {
  property: 'Saved apps keep the value under the old key; the widget would no longer read it.',
  style: 'Saved apps keep the style under the old key; the widget would no longer read it.',
  validation: 'Saved apps keep the rule under the old key; it would stop validating.',
  event: 'Saved handlers on this event would stop running, with no error (the dispatcher drops unknown events).',
  action:
    'Saved event handlers (control component) and RunJS code calling it would do nothing, with no error: the ' +
    'dispatcher skips an action the widget does not have.',
  exposed: 'Bindings like {{components.x.KEY}} in saved apps would resolve to undefined.',
  widget: 'Saved apps with this widget would show "This widget is not available".',
};

const show = (v) => (v === undefined ? 'nothing' : JSON.stringify(v));
const entry = (c) => JSON.stringify({ type: c.type, area: c.area, key: c.key, change: c.change, reason: '<why>' });

/** What a developer reads when the contract spec fails on a break: what changed, who it breaks, and the two ways out. */
export function explainBreak(c) {
  const what = `${c.type} ${AREA_WORDS[c.area]} "${c.key}"`;
  const lines = [];
  if (c.change === 'removed') {
    lines.push(`${what} was removed or renamed.`, `  ${IMPACT[c.area].replace('KEY', c.key)}`);
  } else if (c.change === 'params') {
    lines.push(
      `${what} changed its parameters from ${show(c.from)} to ${show(c.to)}.`,
      '  Saved control-component handlers pass parameters by position, so every saved call would now pass its',
      '  arguments to the wrong parameter. Keep the order and add new parameters at the end.'
    );
  } else if (c.change === 'rules') {
    lines.push(
      `${what} changed its value rules from ${show(c.from)} to ${show(c.to)}.`,
      '  A saved value the old rules accepted and the new ones reject falls back to the default, so saved apps would',
      '  lose it. If the new rules accept every value the old ones did (they only loosen), accept it with that reason.'
    );
  } else if (c.change === 'valueType') {
    lines.push(
      `${what} changed its value type from ${show(c.from)} to ${show(c.to)}.`,
      '  A saved value that no longer validates falls back to the default, so saved apps would lose it.'
    );
  } else {
    const which = c.change === 'default' ? 'default' : 'value a new widget is created with';
    lines.push(
      `${what} changed its ${which} from ${show(c.from)} to ${show(c.to)}.`,
      c.change === 'default'
        ? '  Saved apps that never set it (AI-built apps save only what they set) would change how they look or behave.'
        : '  New widgets would start differently from the ones already in saved apps, and the inspector default would disagree.'
    );
  }
  lines.push(
    '  If the break is intended, add this entry, with the reason, to Widgets/Ui2/__contracts__/acceptedBreaks.json:',
    `    ${entry(c)}`,
    '  Then run `npm run ui2:contracts` (in frontend). Otherwise put the old name or value back.'
  );
  return lines.join('\n');
}

export function explainAll(classified) {
  const breaks = classified.filter((c) => c.verdict === 'break');
  const pending = classified.filter((c) => c.verdict !== 'break');
  const parts = [];
  if (breaks.length)
    parts.push(
      `UI 2.0 widget contract: ${breaks.length} change(s) would break apps saved under an earlier release.\n\n` +
        breaks.map(explainBreak).join('\n\n')
    );
  if (pending.length)
    parts.push(
      'UI 2.0 widget contract files are out of date. Run `npm run ui2:contracts` in frontend and commit ' +
        'Widgets/Ui2/__contracts__:\n' +
        pending
          .map(
            (c) =>
              `  ${c.type} ${AREA_WORDS[c.area]} "${c.key}": ${c.verdict === 'addition' ? 'added' : c.verdict}` +
              (c.reason ? ` (${c.reason})` : '')
          )
          .join('\n')
    );
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------------------------------------------
// The files: where the frozen contracts and accepted breaks live, shared by the spec and the script.
// ---------------------------------------------------------------------------------------------------------------
const fs = require('fs');
const path = require('path');

const UI2 = path.resolve(__dirname, '../..');
export const CONTRACTS_DIR = path.join(UI2, '__contracts__');
export const ACCEPTED_BREAKS = path.join(CONTRACTS_DIR, 'acceptedBreaks.json');

export const readFrozenContracts = () =>
  Object.fromEntries(
    (fs.existsSync(CONTRACTS_DIR) ? fs.readdirSync(CONTRACTS_DIR) : [])
      .filter((f) => /^Shad\w+\.json$/.test(f))
      .map((f) => [f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), 'utf8'))])
  );

export const readAcceptedBreaks = () =>
  fs.existsSync(ACCEPTED_BREAKS) ? JSON.parse(fs.readFileSync(ACCEPTED_BREAKS, 'utf8')).breaks || [] : [];

/** Compares the live configs with the frozen contracts. */
export function compareWithFrozen({ configs, frozen = readFrozenContracts(), acceptedBreaks }) {
  const liveContracts = Object.fromEntries(configs.map((c) => [c.name, contractOf(c)]));
  const types = [...new Set([...Object.keys(frozen), ...Object.keys(liveContracts)])].sort();
  const changes = types.flatMap((type) => diffContract(frozen[type], liveContracts[type]));
  const classified = classify(changes, { acceptedBreaks: acceptedBreaks ?? readAcceptedBreaks() });
  return { liveContracts, classified };
}

export const contractFile = (type) => path.join(CONTRACTS_DIR, `${type}.json`);
export const serialize = (contract) => `${JSON.stringify(contract, null, 2)}\n`;
