import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { build } from '../../src/lib/library/builder';
import { cssProblems, formatProblem, typeCheck, TYPES_BUILD_INFO } from '../../src/lib/library/type-check';

/* The check an agent gets back from a write, and the type errors a failed bundle now carries with it. */

const GLOBAL_DTS = `declare module '@tooljet/custom-component-sdk' {
  export const ToolJet: { useQuery<T>(name: string): { data: T | undefined; error: Error | null } };
}
declare module '*.css';
`;

const project = (files: Record<string, string>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-typecheck-'));
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'node',
        strict: true,
        skipLibCheck: true,
        types: [],
        noEmit: true,
      },
      include: ['src/**/*'],
    })
  );
  for (const [rel, text] of Object.entries({ 'src/global.d.ts': GLOBAL_DTS, ...files })) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
};

describe('library typecheck', () => {
  const roots: string[] = [];
  const make = (files: Record<string, string>) => {
    const root = project(files);
    roots.push(root);
    return root;
  };
  after(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));

  it('passes a project that compiles', () => {
    expect(typeCheck(make({ 'src/index.ts': 'export const a: number = 1;\n' })).problems).to.deep.equal([]);
  });

  it('names file, line, column, code, message and the line itself', () => {
    const root = make({ 'src/index.ts': "export const a = 1;\nexport const b: number = 'two';\n" });
    const [p] = typeCheck(root).problems;
    expect(p).to.include({ file: 'src/index.ts', line: 2, column: 14, code: 'TS2322' });
    expect(p.message).to.include("Type 'string' is not assignable to type 'number'");
    expect(p.source).to.equal("export const b: number = 'two';");
    expect(formatProblem(p)).to.equal(
      "src/index.ts:2:14 - error TS2322: Type 'string' is not assignable to type 'number'.\n\n2 export const b: number = 'two';"
    );
  });

  it('catches an import of a file not written yet and a missing export, before any build', () => {
    const root = make({
      'src/lib/format.ts': 'export const money = (n: number) => `$${n}`;\n',
      'src/index.ts':
        "import { renewalLabel } from './lib/format';\nimport { Detail } from './VendorDetail';\nexport const x = [renewalLabel, Detail];\n",
    });
    const codes = typeCheck(root).problems.map((p) => `${p.line} ${p.code}`);
    expect(codes).to.include.members(['1 TS2305', '2 TS2307']);
  });

  it('keeps what it learnt in the project, and sees the next write', () => {
    const root = make({ 'src/index.ts': 'export const a: number = 1;\n' });
    typeCheck(root);
    expect(fs.existsSync(path.join(root, TYPES_BUILD_INFO))).to.equal(true);
    fs.writeFileSync(path.join(root, 'src/index.ts'), "export const a: number = 'one';\n");
    expect(typeCheck(root).problems.map((p) => p.code)).to.deep.equal(['TS2322']);
    fs.writeFileSync(path.join(root, 'src/index.ts'), 'export const a: number = 1;\n');
    expect(typeCheck(root).problems).to.deep.equal([]);
  });

  it('reports a stylesheet that would fail the build', () => {
    const root = make({
      'styles/global.css': '.a { color: red; }\n*/\n',
      'styles/theme.css': '@layer utilities {\n  .tnum { font-variant-numeric: tabular-nums; }\n}\n',
      'src/styles/globals.css': '@tailwind base;\n@tailwind utilities;\n@layer utilities { .x { color: red; } }\n',
    });
    const problems = cssProblems(root);
    expect(problems.map((p) => `${p.file}:${p.line}`)).to.have.members(['styles/global.css:2', 'styles/theme.css:1']);
    expect(problems.find((p) => p.file === 'styles/theme.css')!.message).to.include('@tailwind utilities');
  });
});

describe('build - a failed bundle carries its type errors', () => {
  let root: string;
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('lists both, so one round fixes both', async () => {
    root = project({
      'src/index.ts': "import { Missing } from './Missing';\nexport const n: number = 'x';\nexport { Missing };\n",
    });
    let message = '';
    try {
      await build(root);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).to.match(/^Build failed with 1 error/);
    expect(message).to.include('Could not resolve "./Missing"');
    expect(message).to.include('TypeScript compiled (1 errors)');
    expect(message).to.include('src/index.ts:2:14 - error TS2322');
    // The unresolved import is the bundle's error already, not repeated as TS2307.
    expect(message).not.to.include('TS2307');
  }).timeout(60_000);
});
