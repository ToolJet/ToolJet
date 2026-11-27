import { BadRequestException } from '@nestjs/common';
import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { getDynamicVariables } from 'lib/utils';
import { LIBRARY_KIND } from './library-query.util';

// Options that stay on the app query when it is converted to a library consumer.
export const APP_LEVEL_OPTION_KEYS: readonly string[] = [
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

export function splitAppLevelOptions(options: Record<string, unknown>): {
  appLevel: Record<string, unknown>;
  queryLogic: Record<string, unknown>;
} {
  const appLevel: Record<string, unknown> = {};
  const queryLogic: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options ?? {})) {
    (APP_LEVEL_OPTION_KEYS.includes(key) ? appLevel : queryLogic)[key] = value;
  }
  return { appLevel, queryLogic };
}

// What a library copy may read: its own inputs, workspace constants, the signed-in user and the few
// helpers the run scope injects. `secrets` is templates-only: see below.
// JS built-ins are added here too.
const LIBRARY_SCOPE = new Set([
  'input',
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
  ...Object.getOwnPropertyNames(globalThis),
]);

// Same exclusions as buildLibraryVariableMap: these are never resolved on the server.
const NOT_RESOLVED_KEYS = ['inputs', 'transformation', 'transformations'];

const collectStrings = (value: unknown, out: string[] = []): string[] => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
};

const CODE_PARSE = {
  ecmaVersion: 'latest',
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
} as const;

const TEMPLATE_ONLY = 'secrets';

// Identifiers written by an assignment (`a = 1`, `[a, b] = x`): references, not declarations.
function assignmentTargets(node: any, out: number[] = []): number[] {
  if (!node) return out;
  switch (node.type) {
    case 'Identifier':
      out.push(node.start);
      break;
    case 'ArrayPattern':
      node.elements.forEach((e: any) => assignmentTargets(e, out));
      break;
    case 'ObjectPattern':
      node.properties.forEach((p: any) => assignmentTargets(p.value ?? p.argument, out));
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

// Names read but not declared anywhere in the snippet, in source order. `globals.x` reports as `globals.x`.
// ponytail: declared-anywhere (no scope analysis); a name declared in one block shadows a free read in another.
function freeReads(source: string, isTemplate: boolean): string[] {
  const ast = isTemplate ? parse('(' + source + ')', { ecmaVersion: 'latest' }) : parse(source, CODE_PARSE);
  const declarations: { name: string; start: number }[] = [];
  const targets = new Set<number>();
  const reads: { name: string; start: number }[] = [];
  const globalsMember = new Map<number, string>();
  simple(
    ast as any,
    {
      VariablePattern: (node: any) => declarations.push({ name: node.name, start: node.start }),
      AssignmentExpression: (node: any) => assignmentTargets(node.left).forEach((start) => targets.add(start)),
      Identifier: (node: any) => reads.push({ name: node.name, start: node.start }),
      MemberExpression: (node: any) => {
        if (node.object.type !== 'Identifier' || node.object.name !== 'globals') return;
        const { property, computed } = node;
        if (!computed && property.type === 'Identifier') globalsMember.set(node.object.start, property.name);
        else if (computed && property.type === 'Literal') globalsMember.set(node.object.start, String(property.value));
      },
    } as any
  );
  const declared = new Set(declarations.filter(({ start }) => !targets.has(start)).map(({ name }) => name));
  declarations.filter(({ start }) => targets.has(start)).forEach(({ name, start }) => reads.push({ name, start }));
  const allowed = (name: string) => (isTemplate && name === TEMPLATE_ONLY) || LIBRARY_SCOPE.has(name);
  return reads
    .filter(({ name }) => !declared.has(name))
    .sort((a, b) => a.start - b.start)
    .map(({ name, start }) => {
      if (name !== 'globals') return allowed(name) ? null : name;
      const member = globalsMember.get(start);
      // `globals.server` is resolved by the server in templates only (like `secrets`).
      if (member === 'currentUser' || (member === 'server' && isTemplate)) return null;
      return member ? `globals.${member}` : 'globals';
    })
    .filter(Boolean);
}

// The names a library copy of this query would read from outside the library scope (`unparseable` when a snippet
// can't be parsed). Empty means safe to copy.
export function libraryScopeViolations(kind: string, options: Record<string, unknown>): string[] {
  const found: string[] = [];
  const scan = (source: string, isTemplate: boolean) => {
    try {
      found.push(...freeReads(source, isTemplate));
    } catch {
      found.push('unparseable');
    }
  };
  const resolved = Object.fromEntries(
    Object.entries(options ?? {}).filter(([key]) => !NOT_RESOLVED_KEYS.includes(key))
  );
  for (const text of collectStrings(resolved)) {
    // getDynamicVariables' regex has no `s` flag, so flatten newlines like the other callers.
    for (const template of getDynamicVariables(text.replace(/\r?\n/g, ' ')) ?? []) scan(template.slice(2, -2), true);
  }
  if (kind === 'runjs' && typeof options?.code === 'string') scan(options.code, false);
  return [...new Set(found)];
}

// Guards a save aimed at a query that another tab converted to a library consumer: refuses incoming options that
// drop the stored `libraryQueryId`. A fresh library query that has not picked one yet saves freely.
export function assertLibraryConsumerOptions(
  dataSourceKind: string,
  storedOptions: unknown,
  incomingOptions: unknown
): void {
  const idOf = (options: unknown) => (options as Record<string, unknown> | null | undefined)?.libraryQueryId;
  const has = (id: unknown) => typeof id === 'string' && id !== '';
  if (dataSourceKind === LIBRARY_KIND && has(idOf(storedOptions)) && !has(idOf(incomingOptions))) {
    throw new BadRequestException('This query is now a library query. Reload the app to keep editing it.');
  }
}
