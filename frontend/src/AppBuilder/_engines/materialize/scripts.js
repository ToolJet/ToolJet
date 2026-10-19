/**
 * Materialization engine: the rows of a windowed ListView a script reads (RunJS, run from a query or an event handler,
 * and JS transformations), made ready before it runs, as prepare.js makes them ready for a `{{ }}` template.
 *
 * Before the run, its code is analysed (parsed with acorn; kept per text) for each windowed ListView it names
 * (`components.listview1`, `components['listview1']`, `const { listview1 } = components`), following the variables it
 * is put in (`const lv = components.listview1`, `const { children, ...rest } = components.listview1`, `const data =
 * lv.data`) and the values passed through `||`, `??`, `?:` (prepare.js usedAt). A variable is the one its scope
 * declares (scopeOf: a block, a function, a catch clause): one of the same name declared in another scope is another;
 * one bound again (assigned, declared twice where it is visible) may hold anything, so it reads every row.
 *
 * - its `children`/`data` read only at literal row indexes (or a `const` holding one): those rows are read (rows.js
 *   readRow), or drawn first when a child can only be read drawn (ensureRowMounted), as prepare.js reads a row;
 * - its `children`/`data` used any other way (a computed index, a loop, Object.keys, spread, JSON.stringify, passed on,
 *   returned), its entry used whole (passed on, returned, spread) or read at a key computed from more than a literal
 *   (or a `const` holding one): every row is read in the background (materialize.js, within LIMITS.backgroundMs), the
 *   page responsive meanwhile; a read refused, or rows that kept changing while they were read (MAX_WAITS), fail the
 *   run with the MaterializationError's message;
 * - other keys of its entry (`components.listview1.id`, `lv.selectedRecord`, `lv[k]` with `const k = 'id'`), keys of
 *   its `children`/`data` that are no row (`data.length`), the entry or its rows only tested (`if
 *   (components.listview1)`), a comment or a string: nothing. Nor `components` used whole or read by a computed name
 *   (`return components`, `components['text' + i]`), nor a script binding its own `components`: they read the
 *   ListView's drawn rows, as they always did.
 *
 * The run then sees, for each such ListView, a plain per-run entry (never frozen by the engine, never a Proxy or an
 * accessor stored) whose `children`/`data` hold the rows read for it, or every row. When the store's entry changed
 * since the script last read it (an action ran on a row: its result is written into the store's children/data), the
 * store's own rows, the drawn and changed ones, are written over it first, so a row read after an action on it shows
 * the action's result; once the ListView's rows are replaced (its data set anew), the store's entry is read, as before.
 * A variable holding the entry (or its rows) may keep what it held before an action, as a held store entry did:
 * `components.listview1` read again shows its result. RunJS reads it through its `components` getter while it runs
 * (after, the store's entry: what escapes the run, a returned `components`, never reaches it), a transformation finds
 * it in its `components`, taken once it is ready.
 *
 * A script naming no windowed ListView's rows, any script in a module with none, and RunPy run as they always did: the
 * analysis is skipped in a module with none, and kept per code text otherwise.
 */
import { parse } from 'acorn';
import { ancestor } from 'acorn-walk';
import { remember } from '@/AppBuilder/_engines/data/expressions';
import { hasWindowedListview, listviewRows, slotsOf } from './rows';
import { MaterializationError } from './estimate';
import { prepareReads, readerOf, rowNumber, ROWS_KEYS, tested, usedAt } from './prepare';

// How often a run waits for rows being drawn or read (read again when they changed meanwhile) before it fails.
const MAX_WAITS = 5;

const FUNCTIONS = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
// What `let`, `const`, a class or a function declaration is bound in.
const BLOCKS = [
  'Program',
  'BlockStatement',
  'StaticBlock',
  'SwitchStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
];

// The nearest of `types` from `ancestors[at]` out (the program at last).
const nearest = (ancestors, at, types) => {
  for (let i = at; i > 0; i--) if (types.includes(ancestors[i].type)) return ancestors[i];
  return ancestors[0];
};

// The node a name in a pattern (`ancestors`, the name last) is declared in (a block; a function: a parameter, `var`; a
// catch clause), or null when it is assigned (`x = …`, `for (x of …)`).
const scopeOf = (ancestors) => {
  for (let i = ancestors.length - 2; i >= 0; i--) {
    const node = ancestors[i];
    switch (node.type) {
      case 'VariableDeclaration':
        return nearest(ancestors, i - 1, node.kind === 'var' ? FUNCTIONS : BLOCKS);
      case 'ClassDeclaration':
        return nearest(ancestors, i - 1, BLOCKS);
      case 'FunctionDeclaration':
        return node.id === ancestors[i + 1] ? nearest(ancestors, i - 1, BLOCKS) : node;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'ClassExpression':
      case 'CatchClause':
        return node;
      case 'AssignmentExpression':
      case 'ForInStatement':
      case 'ForOfStatement':
        return null;
      default:
    }
  }
  return null;
};

const analyses = new Map();

/**
 * What a script's code reads of the rows of the components it names: Map name → { whole, rows } (`rows`: the literal
 * rows read; `whole`: every row), or null when it reads none (or doesn't parse: the run fails as it always did).
 */
const rowReadsIn = (code) =>
  remember(analyses, code, () => {
    if (!code.includes('components')) return null;
    let ast;
    try {
      ast = parse(code, { ecmaVersion: 'latest', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
    } catch {
      return null;
    }
    // Each variable, per node it is declared in (scopeOf) → { name, count, constant, value }: how often it is bound
    // (declared, assigned), and whether a `const` declares it with a literal (`value`).
    const scopes = new Map();
    const assigned = [];
    let own = false;
    ancestor(ast, {
      VariablePattern(node, _state, ancestors) {
        if (node.name === 'components') own = true;
        const scope = scopeOf(ancestors);
        if (!scope) return void assigned.push([node.name, [...ancestors]]);
        if (!scopes.has(scope)) scopes.set(scope, new Map());
        const declared = scopes.get(scope).get(node.name);
        if (declared) return void (declared.count += 1);
        const [declaration, declarator] = ancestors.slice(-3);
        const constant = declaration?.kind === 'const' && declarator.id === node && declarator.init?.type === 'Literal';
        const value = constant ? declarator.init.value : undefined;
        scopes.get(scope).set(node.name, { name: node.name, count: 1, constant, value });
      },
    });
    // Its own `components` isn't the app's: run as it always did.
    if (own) return null;
    // The variable a name used at `ancestors[at]` is: the nearest declared; undefined for a global.
    const variableOf = (name, ancestors, at = ancestors.length - 1) => {
      for (let i = at; i >= 0; i--) {
        const variable = scopes.get(ancestors[i])?.get(name);
        if (variable) return variable;
      }
      return undefined;
    };
    assigned.forEach(([name, ancestors]) => {
      const variable = variableOf(name, ancestors);
      if (variable) variable.count += 1;
    });
    // A key or an index (at `ancestors[at]`): `{ value }` for a literal, or a variable a `const` declares with one;
    // null when computed from more.
    const constantOf = (node, ancestors, at) => {
      if (node.type === 'Literal') return { value: node.value };
      const variable = node.type === 'Identifier' && variableOf(node.name, ancestors, at);
      return variable?.constant && variable.count === 1 ? { value: variable.value } : null;
    };
    const keyOf = (key, computed, ancestors, at) =>
      computed ? constantOf(key, ancestors, at) : { value: key.name ?? key.value };

    const reads = new Map();
    const of = (name) => {
      if (!reads.has(name)) reads.set(name, { whole: false, rows: new Set() });
      return reads.get(name);
    };
    // A variable holding a component's entry (`rows` false) or its children/data → { name, rows }; `fresh`: those
    // whose uses are yet to be followed.
    const aliases = new Map();
    let fresh = [];
    // A variable bound more than once may hold anything where it is used: every row.
    const alias = (variable, name, rows) => {
      if (!variable || variable.count !== 1 || aliases.has(variable)) {
        of(name).whole = true;
        return;
      }
      aliases.set(variable, { name, rows });
      fresh.push(variable);
    };
    // A pattern (at `ancestors[at]`) a component's entry (`rows` false) or its children/data are destructured into:
    // a variable is followed; `{ children, data: d, ...rest }` of an entry, each an alias (a rest: of the entry), other
    // keys nothing; any other pattern every row.
    const patternUsed = (name, pattern, rows, ancestors, at) => {
      const target = pattern.type === 'AssignmentPattern' ? pattern.left : pattern;
      if (target.type === 'Identifier') return alias(variableOf(target.name, ancestors, at), name, rows);
      if (rows || target.type !== 'ObjectPattern') return void (of(name).whole = true);
      target.properties.forEach((property) => {
        if (property.type === 'RestElement') return patternUsed(name, property.argument, false, ancestors, at);
        const key = keyOf(property.key, property.computed, ancestors, at);
        if (!key) of(name).whole = true;
        else if (ROWS_KEYS.includes(String(key.value))) patternUsed(name, property.value, true, ancestors, at);
      });
    };
    const declared = ({ node, parent }) => parent?.type === 'VariableDeclarator' && parent.init === node;
    // A component's children/data, `ancestors[at]`, used.
    const rowsUsed = (name, ancestors, at) => {
      const use = usedAt(ancestors, at);
      const reader = readerOf(use);
      if (reader) {
        if (!reader.computed) return; // a key that is no row
        const index = constantOf(reader.property, ancestors, use.at - 1);
        const row = index ? rowNumber(index.value) : null;
        if (row === null) of(name).whole = true;
        else if (row >= 0) of(name).rows.add(row);
      } else if (declared(use)) patternUsed(name, use.parent.id, true, ancestors, use.at - 1);
      else if (!tested(use)) of(name).whole = true;
    };
    // A component's entry, `ancestors[at]`, used: a key of it (its rows: rowsUsed), held in a variable or destructured
    // (followed), only tested (nothing), else used whole (every row).
    const entryUsed = (name, ancestors, at) => {
      const use = usedAt(ancestors, at);
      const reader = readerOf(use);
      if (reader) {
        const key = keyOf(reader.property, reader.computed, ancestors, use.at - 1);
        if (!key) of(name).whole = true;
        else if (ROWS_KEYS.includes(String(key.value))) rowsUsed(name, ancestors, use.at - 1);
      } else if (declared(use)) patternUsed(name, use.parent.id, false, ancestors, use.at - 1);
      else if (!tested(use)) of(name).whole = true;
    };
    ancestor(ast, {
      Identifier(node, _state, ancestors) {
        if (node.name !== 'components') return;
        const at = ancestors.length - 2;
        const parent = ancestors[at];
        // `components.<name>`, `components['<name>']`; by a computed name: as before.
        if (parent?.type === 'MemberExpression' && parent.object === node) {
          const key = keyOf(parent.property, parent.computed, ancestors, at);
          if (key) entryUsed(String(key.value), ancestors, at);
          return;
        }
        // `const { listview1, listview2: lv } = components`: each entry named; a rest, or `components` used whole in
        // any other way: as before.
        const use = usedAt(ancestors, ancestors.length - 1);
        if (!declared(use) || use.parent.id.type !== 'ObjectPattern') return;
        use.parent.id.properties.forEach((property) => {
          if (property.type === 'RestElement') return;
          const key = keyOf(property.key, property.computed, ancestors, use.at - 1);
          if (key) patternUsed(String(key.value), property.value, false, ancestors, use.at - 1);
        });
      },
    });
    // Each variable's uses, then those of the variables they are put in.
    while (fresh.length) {
      const following = new Set(fresh);
      const names = new Set(fresh.map((variable) => variable.name));
      fresh = [];
      ancestor(ast, {
        Identifier(node, _state, ancestors) {
          if (!names.has(node.name)) return;
          const variable = variableOf(node.name, ancestors);
          if (!following.has(variable)) return;
          const { name, rows } = aliases.get(variable);
          (rows ? rowsUsed : entryUsed)(name, ancestors, ancestors.length - 1);
        },
      });
    }
    for (const [name, read] of reads) if (!read.whole && !read.rows.size) reads.delete(name);
    return reads.size ? reads : null;
  });

/**
 * What a script's code (`code`) reads of the module's windowed ListViews' rows, as prepareReads takes it (`[{ id, row,
 * index }]`, `row` null: every row), or null when it reads none, or the module has none (the analysis is skipped).
 */
export const scriptReadsOf = (get, code, moduleId) => {
  if (typeof code !== 'string' || !hasWindowedListview(get, moduleId)) return null;
  const named = rowReadsIn(code);
  if (!named) return null;
  const ids = get().modules[moduleId]?.componentNameIdMapping ?? {};
  const reads = [];
  named.forEach(({ whole, rows }, name) => {
    const id = ids[name];
    if (!id || !slotsOf(get, id, moduleId)) return;
    if (whole) reads.push({ id, row: null, index: null });
    else rows.forEach((row) => reads.push({ id, row, index: null }));
  });
  return reads.length ? reads : null;
};

const storeEntry = (get, id, moduleId) => get().resolvedStore.modules[moduleId]?.exposedValues?.components?.[id];

/**
 * Makes ready the rows `reads` (scriptReadsOf) take: waits while they are drawn or read in the background, then gives
 * `{ ids, entry(id, store) }`, the ListViews with rows read for the run and each one's per-run entry (`store`: the
 * store's entry now, written over it when it changed since the last call; the store's entry itself once the ListView's
 * rows were replaced), or `{ error }` when a read was refused, or the rows kept changing while they were read.
 */
export const prepareScript = async (get, reads, moduleId) => {
  const ids = [...new Set(reads.map(({ id }) => id))];
  const attempt = () => {
    const components = {};
    ids.forEach((id) => (components[id] = storeEntry(get, id, moduleId)));
    return { components, prepared: prepareReads(get, reads, { components }, {}, moduleId) };
  };
  let at = attempt();
  for (let waits = 0; at.prepared?.pending; waits++) {
    if (waits === MAX_WAITS) {
      const names = ids.map((id) => get().getComponentNameFromId?.(id, moduleId) ?? id).join(', ');
      return { error: new MaterializationError('changed', `${names}'s rows kept changing while they were read.`) };
    }
    await at.prepared.pending;
    at = attempt();
  }
  if (at.prepared?.error) return { error: at.prepared.error };

  // id → { rows, store, entry }: the ListView's rows read, the store's entry as last written over the run's entry.
  const entries = new Map();
  ids.forEach((id) => {
    const entry = at.prepared?.state?.components[id];
    if (entry && entry !== at.components[id]) {
      entries.set(id, { rows: listviewRows(get, id, moduleId), store: at.components[id], entry });
    }
  });
  return {
    ids: [...entries.keys()],
    entry: (id, store) => {
      const known = entries.get(id);
      // Its rows replaced (an action set its data): what was read is gone, the store's entry is the ListView's.
      if (known.rows !== listviewRows(get, id, moduleId)) return store;
      if (store && store !== known.store) {
        known.store = store;
        // Frozen once the script stored it (set it in a variable, passed it to an action): a copy from then on.
        if (Object.isFrozen(known.entry)) known.entry = { ...known.entry };
        const { entry } = known;
        Object.keys(store).forEach((key) => {
          if (!ROWS_KEYS.includes(key)) entry[key] = store[key];
        });
        ROWS_KEYS.forEach((kind) => {
          const rows = store[kind] ?? {};
          for (const row in rows) {
            if (entry[kind]?.[row] === rows[row]) continue;
            // Every row read is frozen (shared with other reads): copied once for the run, then written into.
            if (!entry[kind] || Object.isFrozen(entry[kind])) entry[kind] = { ...entry[kind] };
            entry[kind][row] = rows[row];
          }
        });
      }
      return known.entry;
    },
  };
};
