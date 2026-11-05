import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { assertTsconfigConfined, Confinement, confinedCompilerHost, projectConfinement } from './confinement';

/*
  A type check without a build, for an agent that has just written files: it learns about a wrong import, a missing
  export or a field the row type does not have before it asks for a build. In the Code mode builds of 2026-11-04 about
  one build in six failed on TypeScript or an unresolved import, and each failed round cost a model turn and a rebuild.

  Incremental: what TypeScript learnt last time is kept in the project (TYPES_BUILD_INFO), so a check after a small
  write re-checks only what the write touched. About 0.5 s on a 5,000-line app, 1.3 s the first time. It reads through
  the build's confinement, like the build's own check.
*/

export const TYPES_BUILD_INFO = path.join('node_modules', '.cache', 'tooljet', 'types.tsbuildinfo');

export interface TypeProblem {
  /** Relative to the project, with forward slashes. */
  file: string;
  line: number;
  column: number;
  /** TS2322 and the like; CSS for a stylesheet. */
  code: string;
  message: string;
  /** The line the problem is on, trimmed. */
  source?: string;
}

const relative = (root: string, file: string) => path.relative(root, file).split(path.sep).join('/');

const clipSource = (line: string | undefined): string | undefined => {
  const text = line?.trim();
  if (!text) return undefined;
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
};

export function toProblem(root: string, d: ts.Diagnostic): TypeProblem {
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (!d.file || d.start === undefined) return { file: '', line: 0, column: 0, code: `TS${d.code}`, message };
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  return {
    file: relative(root, d.file.fileName),
    line: line + 1,
    column: character + 1,
    code: `TS${d.code}`,
    message,
    source: clipSource(d.file.text.split('\n')[line]),
  };
}

/** One problem as TypeScript's own report starts it, then the line it is on: what code_app_build reads. */
export const formatProblem = (p: TypeProblem): string =>
  `${p.file}:${p.line}:${p.column} - error ${p.code}: ${p.message}${p.source ? `\n\n${p.line} ${p.source}` : ''}`;

export function typeCheck(
  projectRoot: string,
  confinement: Confinement = projectConfinement(projectRoot)
): { problems: TypeProblem[]; ms: number } {
  const started = Date.now();
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) throw new Error(`Invalid tsconfig.json: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
  assertTsconfigConfined(ts, confinement, tsConfigPath);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, projectRoot);
  const buildInfo = path.join(projectRoot, TYPES_BUILD_INFO);
  const options: ts.CompilerOptions = {
    ...parsed.options,
    noEmit: true,
    incremental: true,
    tsBuildInfoFile: buildInfo,
  };
  const host = confinedCompilerHost(ts, confinement, options);
  // What ts.createIncrementalCompilerHost adds: each source file versioned by its content, so the build info can tell
  // which files changed since the last check.
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (...args) => {
    const file = getSourceFile(...args);
    if (file)
      (file as ts.SourceFile & { version?: string }).version = createHash('sha256').update(file.text).digest('hex');
    return file;
  };
  // The one file this check writes is its own build info.
  host.writeFile = (file, text) => {
    if (path.resolve(file) !== buildInfo) return;
    fs.mkdirSync(path.dirname(buildInfo), { recursive: true });
    fs.writeFileSync(buildInfo, text);
  };
  const program = ts.createIncrementalProgram({ rootNames: parsed.fileNames, options, host });
  const diagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ].filter((d) => d.category === ts.DiagnosticCategory.Error);
  try {
    program.emit(); // noEmit: writes the build info only
  } catch {
    // A cache that cannot be written makes the next check slower, nothing else.
  }
  return { problems: diagnostics.map((d) => toProblem(projectRoot, d)), ms: Date.now() - started };
}

const LAYER = /@layer\s+(base|components|utilities)\b/g;

/**
 * Stylesheets that would fail the build: a syntax error (a stray `*\/` was 3 failed builds on 2026-11-04), or
 * `@layer` in a file with no `@tailwind` of that layer (styles/global.css loads after Tailwind, so it has none).
 */
export function cssProblems(projectRoot: string): TypeProblem[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const postcss = require('postcss');
  const files = [path.join(projectRoot, 'styles')].concat(path.join(projectRoot, 'src')).flatMap((dir) => listCss(dir));
  const problems: TypeProblem[] = [];
  for (const file of files) {
    const css = fs.readFileSync(file, 'utf8');
    const rel = relative(projectRoot, file);
    try {
      postcss.parse(css, { from: file });
    } catch (err) {
      const e = err as { line?: number; column?: number; reason?: string; message: string };
      problems.push({
        file: rel,
        line: e.line ?? 0,
        column: e.column ?? 0,
        code: 'CSS',
        message: e.reason ?? e.message,
        source: clipSource(css.split('\n')[(e.line ?? 1) - 1]),
      });
      continue;
    }
    for (const m of css.matchAll(LAYER)) {
      if (new RegExp(`@tailwind\\s+${m[1]}\\b`).test(css)) continue;
      const line = css.slice(0, m.index).split('\n').length;
      problems.push({
        file: rel,
        line,
        column: 1,
        code: 'CSS',
        message: `\`@layer ${m[1]}\` needs \`@tailwind ${m[1]}\` in the same file; write plain rules here instead`,
        source: clipSource(css.split('\n')[line - 1]),
      });
    }
  }
  return problems;
}

const listCss = (dir: string): string[] => {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') return listCss(full);
    return entry.isFile() && entry.name.endsWith('.css') ? [full] : [];
  });
};
