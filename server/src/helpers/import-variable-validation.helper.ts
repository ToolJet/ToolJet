import { BadRequestException } from '@nestjs/common';
import { parse, tokenizer, Node } from 'acorn';
import * as walk from 'acorn-walk';
import { readVariableDefinitionMap, VariableDefinitionMap, VariableDefinition } from './variable-definition-map.helper';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : {};
const rows = (value: unknown): RecordValue[] =>
  (Array.isArray(value) ? value : Object.values(record(value))).map(record);
const label = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);

function bindingNames(node: unknown): string[] {
  const n = record(node);
  if (n.type === 'Identifier') return [String(n.name)];
  if (n.type === 'RestElement') return bindingNames(n.argument);
  if (n.type === 'AssignmentPattern') return bindingNames(n.left);
  if (n.type === 'ArrayPattern') return rows(n.elements).flatMap(bindingNames);
  if (n.type === 'ObjectPattern')
    return rows(n.properties).flatMap((p) => bindingNames(p.type === 'RestElement' ? p.argument : p.value));
  return [];
}

function shadowed(name: string, ancestors: Node[]): boolean {
  return ancestors.some((ancestor) => {
    const n = record(ancestor);
    if (['ClassExpression', 'ClassDeclaration'].includes(String(n.type)) && bindingNames(n.id).includes(name)) {
      return true;
    }
    if (['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(String(n.type))) {
      if (rows(n.params).flatMap(bindingNames).includes(name) || bindingNames(n.id).includes(name)) return true;
      // var is function-scoped, including declarations inside nested blocks (but not nested functions).
      let declared = false;
      walk.recursive(n.body as Node, null, {
        FunctionDeclaration() {},
        FunctionExpression() {},
        ArrowFunctionExpression() {},
        VariableDeclaration(node) {
          const declaration = record(node);
          if (
            declaration.kind === 'var' &&
            rows(declaration.declarations).some((d) => bindingNames(d.id).includes(name))
          )
            declared = true;
        },
      });
      if (declared) return true;
    }
    if (n.type === 'CatchClause' && bindingNames(n.param).includes(name)) return true;
    const statements =
      n.type === 'BlockStatement'
        ? rows(n.body)
        : ['ForStatement', 'ForInStatement', 'ForOfStatement'].includes(String(n.type))
          ? [record(n.init ?? n.left)]
          : [];
    return statements.some(
      (s) =>
        (s.type === 'VariableDeclaration' && rows(s.declarations).some((d) => bindingNames(d.id).includes(name))) ||
        ((s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') && bindingNames(s.id).includes(name))
    );
  });
}

function staticString(node: RecordValue): string | null {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && Array.isArray(node.expressions) && node.expressions.length === 0) {
    return label(record(rows(node.quasis)[0]?.value).cooked, '');
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = staticString(record(node.left));
    const right = staticString(record(node.right));
    return left !== null && right !== null ? left + right : null;
  }
  return null;
}

function memberPath(node: unknown): string[] | null {
  const n = record(node);
  if (n.type === 'ChainExpression') return memberPath(n.expression);
  if (n.type === 'Identifier') return [String(n.name)];
  if (n.type !== 'MemberExpression') return null;
  const parent = memberPath(n.object);
  const property = record(n.property);
  const key = n.computed ? staticString(property) : property.name;
  return parent && typeof key === 'string' ? [...parent, key] : null;
}

/** Only literal member access proves an edge. Dynamic names and syntax errors are not executed. */
function references(value: string, fxActive: boolean): Set<string> {
  const refs = new Set<string>();
  const inspect = (expression: Node) =>
    walk.ancestor(expression, {
      MemberExpression(node, _state, ancestors) {
        const path = memberPath(node);
        if (!path || shadowed(path[0], ancestors)) return;
        if (path[0] === 'variables' && path.length >= 2) refs.add(`app:${path[1]}`);
        if (path[0] === 'page' && path[1] === 'variables' && path.length >= 3) refs.add(`page:${path[2]}`);
      },
    });
  if (fxActive && !value.includes('{{')) {
    try {
      inspect(parse(`(${value}\n)`, { ecmaVersion: 'latest' }));
    } catch {
      /* Unparseable is not a proven cycle. */
    }
    return refs;
  }
  let start = value.indexOf('{{');
  while (start !== -1) {
    try {
      const source = value.slice(start + 2);
      const tokens = tokenizer(source, { ecmaVersion: 'latest' });
      let depth = 0;
      let end = -1;
      for (let token = tokens.getToken(); token.type.label !== 'eof'; token = tokens.getToken()) {
        if (token.type.label === '{' || token.type.label === '${') depth++;
        if (token.type.label === '}') {
          if (depth === 0 && source.slice(token.start, token.start + 2) === '}}') {
            end = token.start;
            break;
          }
          depth--;
        }
      }
      if (end >= 0) inspect(parse(`(${source.slice(0, end)}\n)`, { ecmaVersion: 'latest' }));
      start = value.indexOf('{{', start + 2 + (end >= 0 ? end + 2 : 0));
    } catch {
      start = value.indexOf('{{', start + 2);
    }
  }
  return refs;
}

function assertNoCycles(app: VariableDefinitionMap, page: VariableDefinitionMap, context: string): void {
  const definitions = new Map<string, VariableDefinition>([
    ...Object.entries(app).map(([name, definition]) => [`app:${name}`, definition] as const),
    ...Object.entries(page).map(([name, definition]) => [`page:${name}`, definition] as const),
  ]);
  const edges = new Map(
    [...definitions].map(([key, definition]) => [
      key,
      [...references(definition.value, definition.fxActive)].filter((ref) => definitions.has(ref)),
    ])
  );
  const done = new Set<string>();
  for (const root of definitions.keys()) {
    if (done.has(root)) continue;
    const active = new Set<string>();
    const path: string[] = [];
    const stack = [{ key: root, index: 0 }];
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (!active.has(top.key)) {
        active.add(top.key);
        path.push(top.key);
      }
      const next = edges.get(top.key)[top.index++];
      if (next === undefined) {
        done.add(top.key);
        active.delete(top.key);
        path.pop();
        stack.pop();
        continue;
      }
      if (active.has(next))
        throw new BadRequestException(
          `${context}: circular variable dependency ${[...path.slice(path.indexOf(next)), next].join(' → ')}`
        );
      if (!done.has(next)) stack.push({ key: next, index: 0 });
    }
  }
}

/** Validate the original export before conversion, remapping, module reuse, or persistence. No mutation. */
export function assertImportedVariableDefinitions(payload: unknown, forceModule = false): void {
  const input = record(payload);
  if (Array.isArray(input.app)) {
    for (const app of input.app) assertImportedVariableDefinitions(app, forceModule);
    return;
  }
  const definition = record(input.definition);
  const app = record(
    definition.appV2 ?? input.appV2 ?? (input.definition && !input.appVersions ? input.definition : payload)
  );
  const appContext = `App ${label(app.name, label(input.name, label(input.appName, label(app.id, 'unknown'))))}`;
  const isModule = forceModule || app.type === 'module' || input.type === 'module';
  const versions =
    Array.isArray(app.appVersions) && app.appVersions.length
      ? rows(app.appVersions)
      : app.editingVersion
        ? [record(app.editingVersion)]
        : [app];
  const checkedPages = new Set<RecordValue>();
  const flatPages = rows(app.pages);
  for (const version of versions) {
    const context = `${appContext}, version ${label(version.name, label(version.id, 'unknown'))}`;
    const legacy = record(version.definition);
    const maps = [record(version.globalSettings), record(legacy.globalSettings)];
    const appMaps = maps.map((settings) =>
      readVariableDefinitionMap(settings.variables, `${context}, globalSettings.variables`)
    );
    const appMap = appMaps[0] ?? appMaps[1] ?? {};
    const pages = [
      ...flatPages.filter((p) => versions.length === 1 || p.appVersionId === version.id),
      ...rows(legacy.pages),
    ];
    for (const map of appMaps) if (map) assertNoCycles(map, {}, context);
    for (const page of pages) {
      checkedPages.add(page);
      const pageContext = `${context}, page ${label(page.name, label(page.id, 'unknown'))}`;
      const pageMap = readVariableDefinitionMap(page.variables, `${pageContext}, variables`);
      if (isModule && pageMap && Object.keys(pageMap).length)
        throw new BadRequestException(
          `${pageContext}, variables.${Object.keys(pageMap)[0]}: page-variable definitions are not allowed in a module`
        );
      assertNoCycles(appMap, pageMap ?? {}, pageContext);
    }
  }
  // Even orphaned pages that another importer might ignore must not silently carry invalid maps.
  for (const page of flatPages.filter((p) => !checkedPages.has(p))) {
    const context = `${appContext}, version ${label(page.appVersionId, 'unknown')}, page ${label(page.name, label(page.id, 'unknown'))}, variables`;
    const map = readVariableDefinitionMap(page.variables, context);
    if (isModule && map && Object.keys(map).length)
      throw new BadRequestException(
        `${context}.${Object.keys(map)[0]}: page-variable definitions are not allowed in a module`
      );
    assertNoCycles({}, map ?? {}, context);
  }
  for (const module of rows(app.modules)) assertImportedVariableDefinitions(module, true);
}
