import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import type { AppJson, Snapshot } from './project';

/*
  `tooljet app check`: the code's references to the platform, checked against the app. A query named in useQuery or
  useAppQuery that the app does not have, a route id or path the code page does not declare, a <Route path> the
  registry does not list, or a page handle that does not exist is an error.
*/

export interface Finding {
  file: string;
  line: number;
  message: string;
}

const SOURCE = /\.(tsx?|jsx?)$/;

const listSources = (dir: string, out: string[] = []): string[] => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listSources(full, out);
    else if (SOURCE.test(entry.name) && entry.name !== 'tooljet.gen.ts' && !entry.name.endsWith('.d.ts'))
      out.push(full);
  }
  return out;
};

const segmentsMatch = (pattern: string, concrete: string): boolean => {
  const want = pattern.split('?')[0].split('/').filter(Boolean);
  const have = concrete.split('?')[0].split('/').filter(Boolean);
  if (want.length !== have.length) return false;
  return want.every((w, i) => w.startsWith(':') || w === have[i]);
};

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/*
  The typed hooks (tooljet.gen.ts) refuse a run() value the query does not declare, because ToolJet drops it and the
  filter it was meant for silently does nothing. A type assertion turns that check off, so a cast of a useAppQuery
  hook, of its run, or of the parameter object passed to run is an error here. Casts of anything else (a row, .data,
  what run() resolves to) are left alone, and so is `as const`.
*/

type Node = ts.Node;
type Assertion = ts.AsExpression | ts.TypeAssertion;

const unwrap = (node: Node): Node => {
  let n = node;
  while (ts.isParenthesizedExpression(n) || ts.isNonNullExpression(n) || ts.isSatisfiesExpression(n)) n = n.expression;
  return n;
};

const isAssertion = (node: Node): node is Assertion =>
  (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) &&
  !(ts.isTypeReferenceNode(node.type) && node.type.typeName.getText() === 'const');

const isHookCall = (node: Node): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) return false;
  const callee = unwrap(node.expression);
  return (
    (ts.isIdentifier(callee) && callee.text === 'useAppQuery') ||
    (ts.isPropertyAccessExpression(callee) && callee.name.text === 'useAppQuery')
  );
};

const queryNameOf = (call: ts.CallExpression): string | null => {
  const first = call.arguments[0];
  return first && ts.isStringLiteralLike(first) ? first.text : null;
};

const castText = (assertion: Assertion): string => {
  const types: string[] = [];
  let n: Node = assertion;
  while (isAssertion(n)) {
    types.push(n.type.getText());
    const parent = n.parent;
    if (ts.isParenthesizedExpression(parent) && isAssertion(parent.parent)) n = parent.parent;
    else if (isAssertion(parent)) n = parent;
    else break;
  }
  const text = `as ${types.join(' as ')}`.replace(/\s+/g, ' ');
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
};

export function queryCastFindings(fileName: string, text: string): { line: number; message: string }[] {
  const kind = /\.[jt]sx$/.test(fileName)
    ? ts.ScriptKind.TSX
    : /\.jsx?$/.test(fileName)
    ? ts.ScriptKind.JS
    : ts.ScriptKind.TS;
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  // Hook objects and run functions by local name, with the query each one runs when the name is a literal.
  const hooks = new Map<string, string | null>();
  const runs = new Map<string, string | null>();
  const declarations: ts.VariableDeclaration[] = [];
  const collect = (node: Node) => {
    if (ts.isVariableDeclaration(node)) declarations.push(node);
    ts.forEachChild(node, collect);
  };
  collect(source);

  const hookOf = (node: Node): { query: string | null } | null => {
    const n = unwrap(node);
    if (isHookCall(n)) return { query: queryNameOf(n) };
    if (ts.isIdentifier(n) && hooks.has(n.text)) return { query: hooks.get(n.text) ?? null };
    return null;
  };
  const runOf = (node: Node): { query: string | null; text: string } | null => {
    const n = unwrap(node);
    if (ts.isIdentifier(n) && runs.has(n.text)) return { query: runs.get(n.text) ?? null, text: n.text };
    const named =
      (ts.isPropertyAccessExpression(n) && n.name.text === 'run') ||
      (ts.isElementAccessExpression(n) &&
        ts.isStringLiteralLike(n.argumentExpression) &&
        n.argumentExpression.text === 'run');
    if (!named) return null;
    const hook = hookOf((n as ts.PropertyAccessExpression | ts.ElementAccessExpression).expression);
    return hook ? { query: hook.query, text: n.getText() } : null;
  };

  // Aliases are followed to a fixed point: `const q = useAppQuery(...)`, `const { run: go } = q`, `const r = q.run`.
  for (let changed = true; changed; ) {
    changed = false;
    for (const d of declarations) {
      if (!d.initializer) continue;
      const add = (map: Map<string, string | null>, name: string, query: string | null) => {
        if (!map.has(name)) {
          map.set(name, query);
          changed = true;
        }
      };
      const hook = hookOf(d.initializer);
      if (hook && ts.isIdentifier(d.name)) add(hooks, d.name.text, hook.query);
      if (hook && ts.isObjectBindingPattern(d.name)) {
        for (const element of d.name.elements) {
          const property = element.propertyName ?? element.name;
          if (ts.isIdentifier(property) && property.text === 'run' && ts.isIdentifier(element.name))
            add(runs, element.name.text, hook.query);
        }
      }
      const run = runOf(d.initializer);
      if (run && ts.isIdentifier(d.name)) add(runs, d.name.text, run.query);
    }
  }

  const findings: { line: number; message: string }[] = [];
  const seen = new Set<number>();
  const report = (node: Node, message: string) => {
    const start = node.getStart(source);
    if (seen.has(start)) return;
    seen.add(start);
    findings.push({ line: source.getLineAndCharacterOfPosition(start).line + 1, message });
  };
  const of = (query: string | null) => (query ? ` of query "${query}"` : '');
  const why =
    'a cast hides the parameters the query does not declare, and ToolJet drops those. Declare a new parameter in the query and read it there';
  const loose = (type: ts.TypeNode | undefined) =>
    !!type && (type.kind === ts.SyntaxKind.AnyKeyword || type.kind === ts.SyntaxKind.UnknownKeyword);
  // A parameter object that reached run() through a cast: cast in place, spread from a cast, or a variable made by one.
  const castParams = (node: Node): Node | null => {
    const n = unwrap(node);
    if (isAssertion(n)) return n;
    if (ts.isObjectLiteralExpression(n)) {
      for (const p of n.properties) if (ts.isSpreadAssignment(p) && castParams(p.expression)) return p;
      return null;
    }
    if (ts.isIdentifier(n)) {
      const made = declarations.find(
        (d) =>
          ts.isIdentifier(d.name) &&
          d.name.text === n.text &&
          ((d.initializer && isAssertion(unwrap(d.initializer))) || loose(d.type))
      );
      return made ? n : null;
    }
    return null;
  };

  const visit = (node: Node) => {
    if (isAssertion(node)) {
      const target = unwrap(node.expression);
      const run = runOf(target);
      const hook = run ? null : hookOf(target);
      if (run)
        report(
          node,
          `${run.text} is cast (${castText(node)}): do not cast run()${of(
            run.query
          )}; ${why}. To type the rows, cast what run() returns or .data instead`
        );
      else if (hook)
        report(
          node,
          `${target.getText().slice(0, 40)} is cast (${castText(node)}): do not cast the useAppQuery hook${of(
            hook.query
          )}; ${why}. To type the rows, cast .data or what run() returns instead`
        );
    }
    if (ts.isVariableDeclaration(node) && node.initializer && loose(node.type)) {
      const run = runOf(node.initializer);
      const hook = run ? null : hookOf(node.initializer);
      if (run || hook)
        report(
          node,
          `${node.name.getText()} is typed ${node.type!.getText()}: do not loosen the type of ${
            run ? 'run()' : 'the useAppQuery hook'
          }${of((run ?? hook)!.query)}; ${why}`
        );
    }
    if (ts.isCallExpression(node) && node.arguments.length) {
      const run = runOf(node.expression);
      const cast = run && castParams(node.arguments[0]);
      if (run && cast)
        report(
          cast,
          `the parameters passed to ${run.text}() are cast: pass them to run()${of(run.query)} uncast; ${why}`
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}

export function checkSources(srcDir: string, app: AppJson, snapshot: Snapshot): Finding[] {
  const findings: Finding[] = [];
  const queries = new Set(snapshot.queries.map((q) => q.name));
  const routeIds = new Set(app.routes.map((r) => r.id));
  const routePaths = app.routes.map((r) => r.path);
  const pages = new Set(snapshot.pages.map((p) => p.handle));
  const rules: { pattern: RegExp; test: (value: string) => string | null }[] = [
    {
      pattern: /\buse(?:App)?Query\s*(?:<[^>]*>)?\(\s*['"`]([^'"`]+)['"`]/g,
      test: (name) =>
        queries.has(name) ? null : `query "${name}" does not exist in the app (pull lists ${queries.size} queries)`,
    },
    {
      pattern: /\broutePath\(\s*['"`]([^'"`]+)['"`]/g,
      test: (id) => (routeIds.has(id) ? null : `route id "${id}" is not in app.json`),
    },
    {
      pattern: /\bnavigate\(\s*['"`](\/[^'"`$]*)['"`]/g,
      test: (p) =>
        routePaths.some((pattern) => segmentsMatch(pattern, p)) ? null : `path "${p}" matches no route in app.json`,
    },
    {
      pattern: /<(?:Link|NavLink)\b[^>]*\bto=\s*['"](\/[^'"]*)['"]/g,
      test: (p) =>
        routePaths.some((pattern) => segmentsMatch(pattern, p)) ? null : `link to "${p}" matches no route in app.json`,
    },
    {
      pattern: /<Route\b[^>]*\bpath=\s*['"]([^'"]+)['"]/g,
      test: (p) =>
        routePaths.includes(p)
          ? null
          : `<Route path="${p}"> is not declared in app.json routes (permissions key on them)`,
    },
    {
      pattern: /\bgoToPage\(\s*['"`]([^'"`]+)['"`]/g,
      test: (handle) => (pages.has(handle) ? null : `page "${handle}" does not exist in the app`),
    },
  ];
  for (const file of listSources(srcDir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const rule of rules) {
      for (const match of text.matchAll(rule.pattern)) {
        const message = rule.test(match[1]);
        if (message)
          findings.push({
            file: path.relative(path.dirname(srcDir), file),
            line: lineOf(text, match.index ?? 0),
            message,
          });
      }
    }
    if (text.includes('useAppQuery'))
      for (const f of queryCastFindings(file, text))
        findings.push({ file: path.relative(path.dirname(srcDir), file), ...f });
  }
  return findings;
}
