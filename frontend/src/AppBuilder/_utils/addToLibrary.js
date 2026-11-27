import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { getDynamicVariables, validateQueryName } from '@/_helpers/utils';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

// Turns an app query into the options of its library copy (app references -> `{{input.<name>}}`) plus the input map
// the app query keeps. Mirrors the server's re-check in server/src/modules/data-queries/library/add-to-library.util.ts.

// Options that stay on the app query (same list as the server's APP_LEVEL_OPTION_KEYS).
const APP_LEVEL_OPTION_KEYS = [
  'runOnPageLoad',
  'runOnDependencyChange',
  'requestConfirmation',
  'requestConfirmationFx',
  'confirmationMessage',
  'showSuccessNotification',
  'successMessage',
  'notificationDuration',
  'disableQuery',
  'disabledMessage',
  'enableTransformation',
  'transformations',
  'transformation',
  'transformationLanguage',
];

// What a library copy can read, plus JS built-ins. A fixed list, not `globalThis`: in the browser that would let
// `window`, `document`, ... through. `input` is not here: in an app query it means a module input (app state).
const LIBRARY_SCOPE = new Set([
  'constants',
  'globals',
  'moment',
  '_',
  'axios',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'arguments',
  'undefined',
  'NaN',
  'Infinity',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'BigInt',
  'Math',
  'JSON',
  'Date',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Reflect',
  'Proxy',
  'Intl',
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'EvalError',
  'URIError',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'encodeURIComponent',
  'decodeURI',
  'decodeURIComponent',
  'structuredClone',
  'console',
  'URL',
  'URLSearchParams',
  'atob',
  'btoa',
]);

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// `components.<uuid>` is not valid JS; swap it for a harmless member so the template parses.
const ID_REFERENCE = new RegExp(`\\b(components|queries)(\\??\\.|\\??\\.?\\[['"]?)${UUID}(['"]?\\])?`, 'g');
const CODE_PARSE = { ecmaVersion: 'latest', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true };

// Identifiers written by an assignment (`a = 1`, `[a, b] = x`): reads, not declarations.
function assignmentTargets(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case 'Identifier':
      out.push(node.start);
      break;
    case 'ArrayPattern':
      node.elements.forEach((e) => assignmentTargets(e, out));
      break;
    case 'ObjectPattern':
      node.properties.forEach((p) => assignmentTargets(p.value ?? p.argument, out));
      break;
    case 'RestElement':
      assignmentTargets(node.argument, out);
      break;
    case 'AssignmentPattern':
      assignmentTargets(node.left, out);
      break;
  }
  return out;
}

// `queries.<name>.<method>(...)`: a method called directly on a query object (run, getData, reset...). Calls on query
// data (`queries.q1.data.map(...)`) are plain app-state reads.
const isQueryMethodCall = (callee) =>
  callee.type === 'MemberExpression' &&
  callee.object.type === 'MemberExpression' &&
  callee.object.object.type === 'Identifier' &&
  callee.object.object.name === 'queries';

// Free identifiers of a snippet (names read but declared nowhere in it, so no scope analysis: a name declared in one
// block hides a free read in another). Splits them into library-resolvable and app state. Throws when unparseable.
function analyze(source, isTemplate) {
  const ast = isTemplate ? parse('(' + source + ')', { ecmaVersion: 'latest' }) : parse(source, CODE_PARSE);
  const declarations = [];
  const targets = new Set();
  const reads = [];
  const globalsMember = new Map();
  let callsQueries = false;
  simple(ast, {
    VariablePattern: (node) => declarations.push({ name: node.name, start: node.start }),
    AssignmentExpression: (node) => assignmentTargets(node.left).forEach((start) => targets.add(start)),
    Identifier: (node) => reads.push({ name: node.name, start: node.start }),
    CallExpression: (node) => {
      if (isQueryMethodCall(node.callee)) callsQueries = true;
    },
    MemberExpression: (node) => {
      if (node.object.type !== 'Identifier' || node.object.name !== 'globals') return;
      const { property, computed } = node;
      if (!computed && property.type === 'Identifier') globalsMember.set(node.object.start, property.name);
      else if (computed && property.type === 'Literal') globalsMember.set(node.object.start, String(property.value));
    },
  });
  const declared = new Set(declarations.filter(({ start }) => !targets.has(start)).map(({ name }) => name));
  declarations.filter(({ start }) => targets.has(start)).forEach(({ name, start }) => reads.push({ name, start }));
  const free = reads
    .filter(({ name }) => !declared.has(name))
    .sort((a, b) => a.start - b.start)
    .map(({ name, start }) => {
      if (name !== 'globals') return name;
      const member = globalsMember.get(start);
      return member === 'currentUser' ? 'globals.currentUser' : member ? `globals.${member}` : 'globals';
    });
  // `secrets` and `globals.server` only exist on the server, so they stay in `{{ }}` templates and are never inputs.
  const resolvable = (name) =>
    name === 'globals.currentUser' ||
    (name !== 'globals' &&
      (LIBRARY_SCOPE.has(name) || (isTemplate && (name === 'secrets' || name === 'globals.server'))));
  return {
    appState: [...new Set(free.filter((n) => !resolvable(n)))],
    usesParameters: free.includes('parameters'),
    usesSecrets: free.includes('secrets') || free.includes('globals.server'),
    callsQueries,
  };
}

const analyzeTemplate = (template) => analyze(template.slice(2, -2).replace(ID_REFERENCE, '$1.__id'), true);

const TEMPLATE = /\{\{(.*?)\}\}/gs;
const templatesOf = (text) => getDynamicVariables(text) ?? [];

// Name-form text of a template: `components.<uuid>.x` -> `components["table1"].x` (valueWithBrackets), with plain
// names shown as `.name` again. (The parser's `valueWithId` is the dot form but breaks on names like `my-table`.)
const nameForm = (template, ctx) =>
  extractAndReplaceReferencesFromString(
    template,
    ctx.componentIdNameMapping,
    ctx.queryIdNameMapping
  ).valueWithBrackets.replace(/\["([A-Za-z_$][\w$]*)"\]/g, '.$1');

// Last identifier in the name-form text outside string literals (`{{components.table1.selectedRow.id}}` -> `id`).
function baseInputName(template, ctx) {
  const names = nameForm(template, ctx)
    .slice(2, -2)
    .replace(/"[^"]*"|'[^']*'/g, '')
    .match(/[A-Za-z_$][\w$]*/g);
  return names?.[names.length - 1] ?? 'value';
}

const uniqueName = (base, taken) => {
  let name = base;
  for (let i = 2; taken.has(name); i++) name = base + i;
  return name;
};

export function planAddToLibrary(query, ctx) {
  const { kind, name: queryName, options = {} } = query;
  const blocked = [];
  const block = (reason) => {
    if (!blocked.includes(reason)) blocked.push(reason);
  };

  if (!queryName || !validateQueryName(queryName)) {
    block('The query name can only have letters, digits, underscore and hyphen.');
  }

  const inputByTemplate = new Map(); // id-form template -> input name
  const usedNames = new Set();
  const inputList = [];

  const inputFor = (template) => {
    if (!inputByTemplate.has(template)) {
      const name = uniqueName(baseInputName(template, ctx).replace(/[^\w$]/g, '_'), usedNames);
      usedNames.add(name);
      inputByTemplate.set(template, name);
      inputList.push({
        name,
        expression: nameForm(template, ctx),
        template,
      });
    }
    return inputByTemplate.get(template);
  };

  // Rewrites every app-state template in one string in a single pass over the original text. A template in a field
  // that never runs just becomes an unused input.
  const convertString = (text) => {
    // getDynamicVariables returns `{{ }}` matches or `%%` matches, never both, so look for `%%` on its own.
    if (/%%[\s\S]*?%%/.test(text)) {
      block('Uses %% expressions, which a library query cannot resolve.');
      return text;
    }
    return text.replace(TEMPLATE, (template) => {
      let result;
      try {
        result = analyzeTemplate(template);
      } catch {
        block(`Could not read the expression ${template}.`);
        return template;
      }
      if (result.usesParameters) {
        block(`${template} reads parameters, which a library query does not support.`);
        return template;
      }
      if (!result.appState.length && !result.callsQueries) return template;
      if (result.callsQueries) {
        block(`${template} calls a query, which a library query cannot do.`);
        return template;
      }
      if (result.usesSecrets) {
        block(`${template} mixes app values with secrets or server globals. Split it into separate expressions.`);
        return template;
      }
      return `{{input.${inputFor(template)}}}`;
    });
  };

  const convert = (value) => {
    if (typeof value === 'string') return convertString(value);
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convert(v)]));
    return value;
  };

  // RunJS code can't be rewritten: anything outside the library scope blocks. `{{ }}` inside it can't be rewritten either.
  const checkCode = (code) => {
    try {
      const { appState } = analyze(code, false);
      if (appState.length) block(`Uses ${appState.join(', ')}, which a library query can't read.`);
    } catch {
      block('Could not read the code.');
    }
    templatesOf(code).forEach((template) => {
      try {
        const { appState } = analyzeTemplate(template);
        if (appState.length) block(`Uses ${appState.join(', ')} inside ${template}, which a library query can't read.`);
      } catch {
        block(`Could not read the expression ${template}.`);
      }
    });
  };

  const libraryOptions = {};
  for (const [key, value] of Object.entries(options)) {
    if (APP_LEVEL_OPTION_KEYS.includes(key) || key === 'inputs' || key === 'parameters') continue;
    if (kind === 'runjs' && key === 'code' && typeof value === 'string') {
      checkCode(value);
      libraryOptions[key] = value;
    } else libraryOptions[key] = convert(value);
  }

  // Library queries take inputs, not parameters.
  if (Array.isArray(options.parameters) && options.parameters.length) {
    block('Has parameters, which a library query does not support. Remove them first.');
  }

  const taken = new Set(ctx.takenNames ?? []);
  libraryOptions.inputs = inputList.map(({ name }) => ({ name, defaultValue: '' }));
  return {
    blocked,
    name: uniqueName(queryName, taken),
    libraryOptions,
    inputs: Object.fromEntries(inputList.map(({ name, template }) => [name, template])),
    inputList: inputList.map(({ name, expression }) => ({ name, expression })),
  };
}
