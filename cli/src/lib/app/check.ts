import * as fs from 'fs';
import * as path from 'path';
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
    else if (SOURCE.test(entry.name) && entry.name !== 'tooljet.gen.ts' && !entry.name.endsWith('.d.ts')) out.push(full);
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

export function checkSources(srcDir: string, app: AppJson, snapshot: Snapshot): Finding[] {
  const findings: Finding[] = [];
  const queries = new Set(snapshot.queries.map((q) => q.name));
  const routeIds = new Set(app.routes.map((r) => r.id));
  const routePaths = app.routes.map((r) => r.path);
  const pages = new Set(snapshot.pages.map((p) => p.handle));
  const rules: { pattern: RegExp; test: (value: string) => string | null }[] = [
    {
      pattern: /\buse(?:App)?Query\s*(?:<[^>]*>)?\(\s*['"`]([^'"`]+)['"`]/g,
      test: (name) => (queries.has(name) ? null : `query "${name}" does not exist in the app (pull lists ${queries.size} queries)`),
    },
    {
      pattern: /\broutePath\(\s*['"`]([^'"`]+)['"`]/g,
      test: (id) => (routeIds.has(id) ? null : `route id "${id}" is not in app.json`),
    },
    {
      pattern: /\bnavigate\(\s*['"`](\/[^'"`$]*)['"`]/g,
      test: (p) => (routePaths.some((pattern) => segmentsMatch(pattern, p)) ? null : `path "${p}" matches no route in app.json`),
    },
    {
      pattern: /<(?:Link|NavLink)\b[^>]*\bto=\s*['"](\/[^'"]*)['"]/g,
      test: (p) => (routePaths.some((pattern) => segmentsMatch(pattern, p)) ? null : `link to "${p}" matches no route in app.json`),
    },
    {
      pattern: /<Route\b[^>]*\bpath=\s*['"]([^'"]+)['"]/g,
      test: (p) => (routePaths.includes(p) ? null : `<Route path="${p}"> is not declared in app.json routes (permissions key on them)`),
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
        if (message) findings.push({ file: path.relative(path.dirname(srcDir), file), line: lineOf(text, match.index ?? 0), message });
      }
    }
  }
  return findings;
}
